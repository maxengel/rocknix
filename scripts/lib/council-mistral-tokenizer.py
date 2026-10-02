"""Measure one exact Mistral chat request locally; never dispatch or certify fit.

Usage: python -I -c '<reviewed worker source>' --tokenizer /absolute/tekken.json
Input: exact UTF-8 request JSON on stdin, at most 32 MiB.
Output: one small measurement JSON object, or a content-free error code on stderr.
The caller bounds process time/output and supplies the isolated Python environment.
"""

import contextlib
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import stat
import sys
import tempfile


MODEL = "mistralai/mistral-large-2512"
PACKAGE_VERSION = "1.11.7"
TOKENIZER_SHA256 = "e29d19ea32eb7e26e6c0572d57cb7f9eca0f4420e0e0fe6ae1cf3be94da1c0d6"
MAX_REQUEST_BYTES = 32 * 1024 * 1024
MAX_TOKENIZER_BYTES = 20 * 1024 * 1024


class WorkerError(Exception):
    """Only constant, content-free codes may cross the worker boundary."""


def fail(code):
    raise WorkerError(code)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            fail("invalid_request")
        result[key] = value
    return result


def reject_constant(_value):
    fail("invalid_request")


def read_request():
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if len(raw) > MAX_REQUEST_BYTES:
        fail("request_too_large")
    try:
        request = json.loads(
            raw.decode("utf-8", errors="strict"),
            object_pairs_hook=unique_object,
            parse_constant=reject_constant,
        )
    except (UnicodeError, ValueError, RecursionError):
        fail("invalid_request")

    required = {"model", "messages", "max_tokens", "temperature"}
    streaming = {"stream", "stream_options"}
    if not isinstance(request, dict):
        fail("invalid_request")
    if "provider" in request:
        required.add("provider")
        provider = request["provider"]
        if (
            not isinstance(provider, dict)
            or provider.get("allow_fallbacks") is not False
            or provider != {
                "only": ["mistral/eu"],
                "order": ["mistral/eu"],
                "allow_fallbacks": False,
            }
        ):
            fail("invalid_request")
    if set(request) not in (required, required | streaming):
        fail("invalid_request")
    if (
        request["model"] != MODEL
        or type(request["max_tokens"]) is not int
        or request["max_tokens"] != 131072
        or type(request["temperature"]) not in (int, float)
        or request["temperature"] != 0.3
    ):
        fail("invalid_request")
    if "stream" in request:
        options = request["stream_options"]
        if (
            request["stream"] is not True
            or not isinstance(options, dict)
            or set(options) != {"include_usage"}
            or options["include_usage"] is not True
        ):
            fail("invalid_request")

    messages = request["messages"]
    if not isinstance(messages, list) or len(messages) not in (1, 2):
        fail("invalid_request")
    roles = ["user"] if len(messages) == 1 else ["system", "user"]
    for message, role in zip(messages, roles):
        if (
            not isinstance(message, dict)
            or set(message) != {"role", "content"}
            or message["role"] != role
            or not isinstance(message["content"], str)
        ):
            fail("invalid_request")
        try:
            # JSON escapes can otherwise introduce lone surrogate code points.
            message["content"].encode("utf-8", errors="strict")
        except UnicodeError:
            fail("invalid_request")
    return raw, messages


def read_tokenizer(filename):
    try:
        flags = os.O_RDONLY | os.O_NONBLOCK | getattr(os, "O_NOFOLLOW", 0)
        descriptor = os.open(filename, flags)
        with os.fdopen(descriptor, "rb") as source:
            metadata = os.fstat(source.fileno())
            if not stat.S_ISREG(metadata.st_mode) or not 0 < metadata.st_size <= MAX_TOKENIZER_BYTES:
                fail("tokenizer_unavailable")
            data = source.read(MAX_TOKENIZER_BYTES + 1)
    except OSError:
        fail("tokenizer_unavailable")
    if len(data) > MAX_TOKENIZER_BYTES or hashlib.sha256(data).hexdigest() != TOKENIZER_SHA256:
        fail("tokenizer_mismatch")
    return data


def dependencies():
    try:
        versions = {
            name: importlib.metadata.version(name)
            for name in (
                "mistral-common",
                "tiktoken",
                "pydantic",
                "pydantic-core",
                "numpy",
                "regex",
                "Pillow",
                "jsonschema",
                "requests",
                "pydantic-extra-types",
                "typing-extensions",
            )
        }
    except importlib.metadata.PackageNotFoundError:
        fail("dependency_unavailable")
    if versions["mistral-common"] != PACKAGE_VERSION:
        fail("dependency_version_mismatch")
    versions["python"] = ".".join(str(part) for part in sys.version_info[:3])
    return versions


def measure(filename, raw, message_data):
    versions = dependencies()
    data = read_tokenizer(filename)
    try:
        from mistral_common.protocol.instruct.messages import SystemMessage, UserMessage
        from mistral_common.protocol.instruct.request import ChatCompletionRequest
        from mistral_common.tokens.tokenizers.mistral import MistralTokenizer
    except ImportError:
        fail("dependency_unavailable")

    # The library reopens its path. Use the already verified bytes, never the
    # mutable original, and retain the filename required by Tekken selection.
    with tempfile.TemporaryDirectory(prefix="council-mistral-tokenizer-") as directory:
        snapshot = Path(directory) / "tekken.json"
        descriptor = os.open(snapshot, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as destination:
            destination.write(data)
        tokenizer = MistralTokenizer.from_file(str(snapshot))
        if tokenizer.instruct_tokenizer.tokenizer.version.value != "v13":
            fail("tokenizer_version_mismatch")
        message_classes = {"system": SystemMessage, "user": UserMessage}
        messages = [
            message_classes[message["role"]](content=message["content"])
            for message in message_data
        ]
        encoded = tokenizer.encode_chat_completion(
            ChatCompletionRequest(messages=messages, truncate_for_context_length=False)
        )
        measured_input_tokens = len(encoded.tokens)

    return {
        "schema": "council-mistral-measurement-v1",
        "model": MODEL,
        "request_json_sha256": hashlib.sha256(raw).hexdigest(),
        "measured_input_tokens": measured_input_tokens,
        "mistral_common_version": PACKAGE_VERSION,
        "tokenizer_sha256": TOKENIZER_SHA256,
        "tokenizer_version": 13,
        "truncation_enabled": False,
        "message_count": len(message_data),
        "dependencies": versions,
    }


def main(argv):
    try:
        if len(argv) != 2 or argv[0] != "--tokenizer" or not Path(argv[1]).is_absolute():
            fail("invalid_arguments")
        raw, messages = read_request()
        # Dependency warnings or exception details must not escape on either
        # stream. The only public diagnostics are the stable codes below.
        with open(os.devnull, "w") as quiet:
            with contextlib.redirect_stdout(quiet), contextlib.redirect_stderr(quiet):
                result = measure(argv[1], raw, messages)
    except WorkerError as error:
        sys.stderr.write(str(error) + "\n")
        return 2
    except (Exception, KeyboardInterrupt):
        sys.stderr.write("tokenizer_failed\n")
        return 2
    sys.stdout.write(json.dumps(result, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
