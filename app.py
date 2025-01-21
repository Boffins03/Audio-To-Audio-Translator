from flask import Flask, render_template, request, jsonify, send_file
import speech_recognition as sr
from googletrans import Translator
from gtts import gTTS
from pydub import AudioSegment
import os
import tempfile

app = Flask(__name__)
translator = Translator()
audio_folder = "audio_files"
os.makedirs(audio_folder, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/process_audio", methods=["POST"])
def process_audio():
    try:
        language = request.form["language"]
        audio_data = request.files["audio"]
        
        # Save the uploaded file and convert to WAV
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            input_audio_path = temp_audio.name
            audio_data.save(input_audio_path)

        # Convert to WAV if not in correct format
        audio = AudioSegment.from_file(input_audio_path)
        audio.export(input_audio_path, format="wav")

        # Transcribe audio using SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(input_audio_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)

        # Translate text
        translated_text = translator.translate(text, dest=language).text

        # Convert translated text to speech using gTTS
        output_audio_path = os.path.join(audio_folder, "output.mp3")
        tts = gTTS(text=translated_text, lang=language)
        tts.save(output_audio_path)

        return jsonify({"message": "Audio processed successfully!", "audio_path": "output.mp3"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/play_audio", methods=["GET"])
def play_audio():
    try:
        output_audio_path = os.path.join(audio_folder, "output.mp3")
        if os.path.exists(output_audio_path):
            return send_file(output_audio_path)
        else:
            return jsonify({"error": "Audio file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
