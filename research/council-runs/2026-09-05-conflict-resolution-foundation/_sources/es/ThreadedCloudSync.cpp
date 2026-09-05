#include "ThreadedCloudSync.h"
#include "Window.h"
#include "components/AsyncNotificationComponent.h"
#include "guis/GuiMsgBox.h"
#include "utils/Platform.h"
#include "utils/StringUtil.h"
#include <chrono>
#include <cstdio>
#include <thread>
#include <sys/wait.h>
#include "LocaleES.h"

#define ICONINDEX _U("\uF0C2 ")

ThreadedCloudSync* ThreadedCloudSync::mInstance = nullptr;

ThreadedCloudSync::ThreadedCloudSync(Window* window, const std::string& command,
	const std::string& title, const std::string& running)
	: mWindow(window), mCommand(command), mTitle(title), mRunning(running)
{
	mWndNotification = mWindow->createAsyncNotificationComponent();
	mWndNotification->updateTitle(ICONINDEX + (mRunning.empty() ? mTitle : mRunning));
	mWndNotification->updateText(_("Working..."));
	mWndNotification->updatePercent(-1);

	mHandle = new std::thread(&ThreadedCloudSync::run, this);
}

ThreadedCloudSync::~ThreadedCloudSync()
{
	mWndNotification->close();
	mWndNotification = nullptr;

	// Only if it is still us. run() clears this as soon as the work ends so
	// another sync can start during the few seconds the card holds its
	// result -- and if one has, the static belongs to that one now.
	if (ThreadedCloudSync::mInstance == this)
		ThreadedCloudSync::mInstance = nullptr;
}

void ThreadedCloudSync::run()
{
	// Stream the backend's output into the notification card so the user
	// sees live status (rclone --stats-one-line lines, phase banners, ...).
	int ret = -1;
	FILE* pipe = popen((mCommand + " 2>&1").c_str(), "r");
	if (pipe != nullptr)
	{
		char line[512];
		while (fgets(line, sizeof(line), pipe) != nullptr)
		{
			std::string text(line);

			// keep it single-line and printable
			std::string clean;
			for (char c : text)
				if (c >= 32 && c < 127)
					clean += c;

			clean = Utils::String::trim(clean);

			// The card shows progress; the title above it already says what
			// is happening. Everything the backends print used to land here,
			// which meant rules of "====================================" for
			// seconds at a time, and -- during a sync, which runs a restore
			// and then a backup -- banners announcing "CLOUD RESTORE UTILITY"
			// and "CLOUD BACKUP UTILITY" underneath a title reading SYNCING
			// SAVE DATA. Those are written for a log read afterwards, not for
			// somebody watching a handheld.
			//
			// So: transfer progress, and anything that went wrong. A line
			// carries progress if it has a percentage or a "x / y" count.
			const bool hasPercent = clean.find('%') != std::string::npos;
			const bool hasCount   = clean.find(" / ") != std::string::npos;
			const std::string upper = Utils::String::toUpper(clean);
			const bool isProblem =
				upper.find("ERROR") != std::string::npos ||
				upper.find("FAILED") != std::string::npos ||
				upper.find("WARN") != std::string::npos;
			const bool informative = hasPercent || hasCount || isProblem;

			// rclone's own line is written for a terminal:
			// "Transferred: 12.345 MiB / 45.678 MiB, 27%, 1.234 MiB/s, ETA 27s".
			// On a handheld card the useful part is the front of it, and the
			// speed and ETA push everything else off the end.
			auto eta = clean.find(", ETA ");
			if (eta != std::string::npos)
				clean = clean.substr(0, eta);
			if (clean.rfind("Transferred:", 0) == 0)
				clean = Utils::String::trim(clean.substr(12));

			// rclone's check counter -- "Checks: 12 / 70, 17%, Listed 313" --
			// is a comparison, not a transfer. Drawn as a bar it reads as
			// seventy uploads, and somebody who has just exited one game asks
			// why every game is being synced. Say what it is, and leave the
			// bar to the transfer line.
			const bool isChecks = clean.rfind("Checks:", 0) == 0;
			if (isChecks)
			{
				auto comma = clean.find(',');
				const std::string count = Utils::String::trim(
					clean.substr(7, comma == std::string::npos ? std::string::npos : comma - 7));
				clean = _("COMPARING SAVE FILES WITH THE CLOUD") + std::string(" ") + count;
			}

			if (informative && !clean.empty() && mWndNotification != nullptr)
			{
				mWndNotification->updateText(clean);

				// rclone's --stats-one-line already carries the percentage --
				// "Transferred: 12.3 MiB / 45.6 MiB, 27%, 1.2 MiB/s, ETA 27s"
				// -- and it was being thrown away: the bar sat at -1, which
				// means indeterminate, for the whole transfer. Take it from
				// the line already passing through rather than asking rclone
				// for it a second way.
				auto pct = clean.find('%');
				if (!isChecks && pct != std::string::npos && pct > 0)
				{
					size_t start = pct;
					while (start > 0 && isdigit((unsigned char)clean[start - 1]))
						start--;
					if (start < pct)
					{
						int value = atoi(clean.substr(start, pct - start).c_str());
						if (value >= 0 && value <= 100)
							mWndNotification->updatePercent(value);
					}
				}
			}
		}

		int status = pclose(pipe);
		if (WIFEXITED(status))
			ret = WEXITSTATUS(status);
	}

	// One surface for the whole event.
	//
	// The card used to vanish the instant the work ended, and the outcome
	// arrived as a GuiInfoPopup: a different shape, in a different place,
	// at exactly the moment somebody is looking for the answer. Two things
	// appeared where one thing happened. Say it in the card that has been
	// reporting all along, hold it long enough to read, and let that same
	// card fade.
	//
	// "FINISHED" would say it stopped, not that it worked. Somebody who has
	// just sent their saves somewhere wants to be told it went well.
	if (mWndNotification != nullptr)
	{
		mWndNotification->updateTitle(ICONINDEX + mTitle);
		// 3 is the scripts' "another cloud sync holds the lock"; 4 is "no
		// network". Neither is a failure: the boot-time sync was already
		// doing this work, or there was nothing to sync to -- and FAILED
		// would send somebody to a log to find out nothing went wrong.
		mWndNotification->updateText(ret == 0
			? _("COMPLETED SUCCESSFULLY")
			: ret == 3 ? _("SKIPPED - ANOTHER CLOUD SYNC IS RUNNING")
			: ret == 4 ? _("SKIPPED - NO NETWORK CONNECTION")
			: _("FAILED - SEE /var/log/cloud_sync.log"));

		// A full bar on success; on failure the bar goes, because a
		// progress bar left standing under the word FAILED reads as a
		// measure of how much of the failure has completed.
		mWndNotification->updatePercent(ret == 0 ? 100 : -1);

		// Nothing is running any more, so stop claiming otherwise: somebody
		// who wants to start another sync while the card is still up should
		// not be told one is already going.
		if (ThreadedCloudSync::mInstance == this)
			ThreadedCloudSync::mInstance = nullptr;

		// Hold the outcome long enough to read, then let the card fade.
		// Success is two words and a full bar, and somebody who just exited
		// a game is standing there watching it, so two seconds; a skip or a
		// failure is a sentence to act on, so five. Five for everything dated
		// from when a sync took 18 seconds -- once the exit sync came down to
		// about five, the card spent as long saying it was done as it had
		// spent working.
		std::this_thread::sleep_for(std::chrono::seconds(ret == 0 ? 2 : 5));
	}

	delete this;
}

void ThreadedCloudSync::start(Window* window, const std::string& command,
	const std::string& title, const std::string& running)
{
	if (ThreadedCloudSync::mInstance != nullptr)
	{
		window->pushGui(new GuiMsgBox(window, _("A CLOUD SYNC IS ALREADY RUNNING.")));
		return;
	}

	ThreadedCloudSync::mInstance = new ThreadedCloudSync(window, command, title, running);
}
