
	LOG(LogInfo) << "	" << command;

	auto p2kConv = convertP2kFile();

	mRunningGame = gameToUpdate;

	ProcessStartInfo process(command);
	process.window = hideWindow ? NULL : window;
	
	int exitCode = process.run();
	if (exitCode != 0)
		LOG(LogWarning) << "...launch terminated with nonzero exit code " << exitCode << "!";

	mRunningGame = nullptr;

	Utils::FileSystem::FileSystemCache::reset();

	if (SaveStateRepository::isEnabled(this))
	{
		if (options.saveStateInfo != nullptr)
			options.saveStateInfo->onGameEnded(this);

		getSourceFileData()->getSystem()->getSaveStateRepository()->refresh();
	}

	if (!p2kConv.empty()) // delete .keys file if it has been converted from p2k
		Utils::FileSystem::removeFile(p2kConv);

	Scripting::fireEvent("game-end");

	if (!hideWindow && Settings::getInstance()->getBool("HideWindowFullReinit"))
	{
		ResourceManager::getInstance()->reloadAll();
		window->deinit();
		window->init();
		window->setCustomSplashScreen(gameToUpdate->getImagePath(), gameToUpdate->getName(), gameToUpdate);
	}
	else
		window->init(hideWindow);
	
	VolumeControl::getInstance()->init();
	AudioManager::getInstance()->init();

	window->normalizeNextUpdate();

	//update number of times the game has been launched
	if (exitCode == 0)
	{
		int timesPlayed = gameToUpdate->getMetadata().getInt(MetaDataId::PlayCount) + 1;
		gameToUpdate->setMetadata(MetaDataId::PlayCount, std::to_string(static_cast<long long>(timesPlayed)));

		// How long have you played that game? (more than 10 seconds, otherwise
		// you might have experienced a loading problem)
		time_t tend = time(NULL);
		long elapsedSeconds = difftime(tend, tstart);
		long gameTime = gameToUpdate->getMetadata().getInt(MetaDataId::GameTime) + elapsedSeconds;
		if (elapsedSeconds >= 10)
			gameToUpdate->setMetadata(MetaDataId::GameTime, std::to_string(static_cast<long>(gameTime)));

		//update last played time
		gameToUpdate->setMetadata(MetaDataId::LastPlayed, Utils::Time::DateTime(Utils::Time::now()));
		CollectionSystemManager::get()->refreshCollectionSystems(gameToUpdate);
		saveToGamelistRecovery(gameToUpdate);
	}

	window->reactivateGui();

	// Sync saves to the cloud, visibly.
	//
	// This was an OS event hook -- /usr/bin/scripts/game-end/, run by the
	// fireEvent above -- which backgrounded cloud_backup with its output sent
	// to /dev/null. It worked, and no player could ever tell: a silent
	// background job that a reboot kills looks exactly like one that never
	// started, and the first question after exiting a game is whether the save
	// is safe. Running it here puts the answer on the progress card and leaves
	// the outcome on it, which is what every other cloud operation does.
	//
	// It replaces the hook rather than joining it. The hook had no caller but
	// this line, so there is nothing else to keep working -- and two paths to
	// one operation is what the cloud menu was just collapsed to avoid.
	//
	// Not gated on exitCode: an emulator that crashed may still have written a
	// save, and that is the copy most worth having.
	//
	// --saves-only --recent: the after-every-game job is the saves this
	// session touched, pushed now. The system-settings archive is the
	// occasional job and has its own row. Comparing every save on the device
	// against the cloud was 18 seconds of somebody's time to move nothing,
	// most of it remote round trips that had nothing to do with the game
	// just played. With no network, cloud_backup answers exit 4 at once
	// rather than waiting for a probe to time out.
	if (SystemConf::getInstance()->get("cloudsaves.gameexit") == "1"
		&& Utils::FileSystem::exists("/usr/bin/cloud_backup")
		&& !ThreadedCloudSync::isRunning())
	{
		ThreadedCloudSync::start(window, "/usr/bin/cloud_backup --yes --saves-only --recent",
			_("SAVE DATA SYNC"), _("SYNCING SAVE DATA TO THE CLOUD"));
	}

	if (system != nullptr && system->getTheme() != nullptr)
		AudioManager::getInstance()->changePlaylist(system->getTheme(), true);
	else
		AudioManager::getInstance()->playRandomMusic();

	if (exitCode >= 200 && exitCode <= 300)
		window->pushGui(new GuiMsgBox(window, _("AN ERROR OCCURRED") + ":\r\n" + getMessageFromExitCode(exitCode), _("OK"), nullptr, GuiMsgBoxIcon::ICON_ERROR));

	return exitCode == 0;
}

