let mediaRecorder;
let audioChunks = [];
let timerInterval;

function startRecording(boxId) {
    const box = document.getElementById(boxId);
    // const language = document.getElementById(languageId).value;
    const frame = box.querySelector(".recording-frame");
    const timer = frame.querySelector("p");
    
    frame.classList.remove("hidden");
    timer.textContent = "00:00";

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.start();

        let seconds = 0;
        timerInterval = setInterval(() => {
            seconds++;
            timer.textContent = new Date(seconds * 1000).toISOString().substr(14, 5);
        }, 1000);
    });
}

function stopRecording(boxId,languageId) {
    clearInterval(timerInterval);
    const frame = document.getElementById(boxId).querySelector(".recording-frame");
    const language = document.getElementById(languageId).value;
    frame.classList.add("hidden");

    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("language", language);

        fetch("/process_audio", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => alert(data.message || data.error));
    };
    // Stop all audio tracks from the MediaStream
    if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

function playAudio() {
    fetch("/play_audio")
        .then((response) => response.blob())
        .then((audioBlob) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        });
}

// Initialize Select2
$(document).ready(function() {
    $('#language-select-1, #language-select-2').select2();
});
