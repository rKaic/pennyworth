#!/usr/bin/env python3

# prerequisites: as described in https://alphacephei.com/vosk/install and also python module `sounddevice` (simply run command `pip install sounddevice`)
# Example usage using Dutch (nl) recognition model: `python test_microphone.py -m nl`
# For more help run: `python test_microphone.py -h`

import argparse
import queue
import sys
import sounddevice as sd

from vosk import Model, KaldiRecognizer
import os
import json
import threading
import time
import builtins
import socketio

def _create_ws_wrapper(url, timeout=5):
    class WS:
        def __init__(self, url):
            self.sio = socketio.Client()
            self.connected = False
            try:
                self.sio.connect(url, wait=True, transports=['websocket'])
                self.connected = True
            except Exception:
                self.connected = False
        def send(self, msg):
            if not self.connected:
                raise RuntimeError("not connected")
            print("WS emitting message:", msg)
            self.sio.emit('message', msg)
    try:
        return WS(url)
    except Exception:
        return None

class _websocket_module:
    @staticmethod
    def create_connection(url, timeout=5):
        return _create_ws_wrapper(url, timeout)

class _SocketIOConn:
    def __init__(self, url, timeout=5):
        print("Creating SocketIO connection to", url)
        self.sio = socketio.Client()
        self.connected = False
        try:
            self.sio.connect(url, wait=True, transports=['websocket'])
            self.connected = True
            print("Created SocketIO connection to", url)
        except Exception as ex:
            self.connected = False
            print("Failed to create SocketIO connection to", url, ex, file=sys.stderr)
    def send(self, msg):
        if not self.connected:
            raise RuntimeError("not connected")
        print("WS emitting message:", msg)
        self.sio.emit('message', msg)

class _SocketIOModule:
    @staticmethod
    def create_connection(url, timeout=5):
        return _SocketIOConn(url, timeout)

websocket = _SocketIOModule

q = queue.Queue()

# WebSocket sender helper (lazy-connect + reconnect)
class WSClient:
    def __init__(self, url):
        self.url = url
        self.ws = None
        self.lock = threading.Lock()

    def _connect(self):
        if websocket is None:
            print("websocket is None!")
            return
        try:
            self.ws = websocket.create_connection(self.url, timeout=5)
        except Exception:
            self.ws = None

    def send_raw(self, msg: str):
        if websocket is None:
            print("ws-client missing; message:", msg, file=sys.stderr)
            return
        with self.lock:
            print("WS", self.ws)
            if self.ws is None:
                self._connect()
            if self.ws is None:
                return
            try:
                self.ws.send(msg)
            except Exception:
                # try reconnect once
                self.ws = None
                self._connect()
                if self.ws:
                    try:
                        self.ws.send(msg)
                    except Exception:
                        self.ws = None

    def send_json(self, obj):
        try:
            self.send_raw(json.dumps(obj))
        except Exception as ex:
            print("ws-client send_json failed", ex, file=sys.stderr)

# configure websocket URL via environment variable VOICE_WS_URL (fallback)
_WS_URL = os.environ.get("VOICE_WS_URL", "ws://localhost:9002")
ws_client = WSClient(_WS_URL)

# intercept prints of Vosk JSON results and forward to websocket as the JSON format expected:
# {"type":"speech","text":"...","final":true|false}
_orig_print = builtins.print
def _print_and_forward(*args, **kwargs):
    _orig_print(*args, **kwargs)
    try:
        if len(args) != 1:
            return
        s = args[0]
        if not isinstance(s, str):
            return
        s = s.strip()
        if not s.startswith("{") or not s.endswith("}"):
            return
        payload = json.loads(s)
        # Vosk final result: {"result": [...], "text": "..."} or {"text": "..."}
        # Vosk partial result may use {"partial":"..."}
        msg = None
        if "text" in payload:
            msg = {"type": "speech", "text": payload.get("text", ""), "final": True}
        elif "partial" in payload:
            msg = {"type": "speech", "text": payload.get("partial", ""), "final": False}
        if msg and msg["final"]:
            _orig_print("Forwarding speech message to websocket:", msg)
            ws_client.send_json(msg)
    except Exception:
        # don't break main program if forwarding fails
        return

# builtins.print = _print_and_forward
def int_or_str(text):
    """Helper function for argument parsing."""
    try:
        return int(text)
    except ValueError:
        return text

def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))

parser = argparse.ArgumentParser(add_help=False)
parser.add_argument(
    "-l", "--list-devices", action="store_true",
    help="show list of audio devices and exit")
args, remaining = parser.parse_known_args()
if args.list_devices:
    print(sd.query_devices())
    parser.exit(0)
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[parser])
parser.add_argument(
    "-f", "--filename", type=str, metavar="FILENAME",
    help="audio file to store recording to")
parser.add_argument(
    "-d", "--device", type=int_or_str,
    help="input device (numeric ID or substring)")
parser.add_argument(
    "-r", "--samplerate", type=int, help="sampling rate")
parser.add_argument(
    "-m", "--model", type=str, help="language model; e.g. en-us, fr, nl; default is en-us")
args = parser.parse_args(remaining)

try:
    if args.samplerate is None:
        device_info = sd.query_devices(args.device, "input")
        # soundfile expects an int, sounddevice provides a float:
        args.samplerate = int(device_info["default_samplerate"])
        
    if args.model is None:
        model = Model(lang="en-us")
    else:
        model = Model(lang=args.model)

    if args.filename:
        dump_fn = open(args.filename, "wb")
    else:
        dump_fn = None

    with sd.RawInputStream(samplerate=args.samplerate, blocksize = 8000, device=args.device,
            dtype="int16", channels=1, callback=callback):
        print("#" * 80)
        print("Press Ctrl+C to stop the recording")
        print("#" * 80)

        rec = KaldiRecognizer(model, args.samplerate)
        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                result = rec.Result()
                if result:
                    _print_and_forward(result)
            # else:
                # print(rec.PartialResult())
            if dump_fn is not None:
                dump_fn.write(data)

except KeyboardInterrupt:
    print("\nDone")
    parser.exit(0)
except Exception as e:
    parser.exit(type(e).__name__ + ": " + str(e))
