let audioDiv = document.querySelector(".audio-div");
let circleDiv = document.querySelector(".circle-div");

// ==================== الصوت ===================
const playButton = audioDiv.querySelector('#playBtn');
const progressBar = audioDiv.querySelector('.progress-bar');
const currentTimeEl = audioDiv.querySelector('.current-time');
const durationEl = audioDiv.querySelector('.duration');
const playIcon = audioDiv.querySelector('#playIcon');
const pauseIcon = audioDiv.querySelector('#pauseIcon');
const coverImg = audioDiv.querySelector(".cover-image img");
const audio = document.querySelector(".the-audio");
const source = audio.querySelector("source");

// ==================== التنزيل ===================
const circle = document.querySelector('circle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    document.getElementById('percent-label').textContent = percent.toFixed(1) + '%';
}

// الدالة لتحميل الصوت وعرضه
function loadAudio(link) {
    source.src = link;
    audio.load();

    new Promise(resolve => {
        audio.onloadedmetadata = () => resolve(audio.duration || 0);
        audio.onerror = () => resolve(0);
    }).then(duration => {
        audioDuration = duration;
        progressBar.max = Math.floor(audioDuration);
        durationEl.textContent = formatTime(audioDuration);
    });

    circleDiv.style.display = "none";
    audioDiv.style.display = "flex";

    coverImg.src = `https://img.youtube.com/vi/${video_link.split("=")[1]}/maxresdefault.jpg`;
}


audioDiv.style.display = "none";
circleDiv.style.display = "flex";

// ================== API Fetch ===================
let api_link = "https://youtube-to-mp3-api.duckdns.org";
// let video_link = "https://www.youtube.com/watch?v=vZZDe_BHt8g";
let video_link = prompt("🎵 من فضلك أدخل الرابط:", "https://www.youtube.com/watch?v=");

fetch(`${api_link}/url?link=${video_link}`)
    .then(response => response.json())
    .then(data => {
        console.log("✅ النتيجة:", data);
        if (data.download_id) {
            const downloadId = data.download_id;

            const checkStatus = () => {
                fetch(`${api_link}/status/${downloadId}`)
                .then(res => res.json())
                .then(statusData => {
                    console.log("🔄 حالة التحميل:", statusData);

                    // ================= تحديث الدائرة فقط أثناء التنزيل =================
                    if (statusData.status && typeof statusData.status.progress === 'number' && statusData.status.status !== "done downloading") {
                        setProgress(Math.min(statusData.status.progress, 100));
                    }

                    // ================= انتهاء التحميل =================
                    if (
                        statusData.status &&
                        statusData.status.status === "done"
                    ) {
                        let fileLinks = statusData.status.whole_file.map(f => `${api_link}/${f}`);
                        loadAudio(fileLinks[0]);
                    } else if (statusData.status && statusData.status.status === "error") {
                        console.error("❌ حدث خطأ أثناء التحميل");
                    } else {
                        setTimeout(checkStatus, 100);
                    }
                })
                .catch(err => {
                    console.error("❌ خطأ في جلب الحالة:", err);
                    setTimeout(checkStatus, 100);
                });
            };

            checkStatus();
        }
    })
    .catch(error => console.error("❌ خطأ في الطلب:", error));


// ==================== تشغيل الصوت ===================
let isPlaying = false;
let audioDuration = 0;

// تنسيق الوقت
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const sec = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
    } else {
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }
}

// زر التشغيل
playButton.addEventListener('click', () => {
    if(!isPlaying){
        play();
    } else {
        pause();
    }
});

function play() {
    audio.play();
    isPlaying = true;
    toPause();
}

function pause() {
    audio.pause();
    isPlaying = false;
    toPlay();
}

setInterval(() => {
    if(audioDiv.style.display == "flex") {
        // الشريط والوقت الحالي
        makeProgress();

        // اقف لو وصلت للآخر
        if (Math.floor(audio.currentTime) >= Math.floor(audio.duration)) {
            pause();
        }
    }
}, 100);

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault(); // عشان ماينزلش صفحة
    
        if (audio.paused) {
            if (Math.floor(audio.currentTime) >= Math.floor(audio.duration)) {
                audio.currentTime = 0;
            }

            play();
        } else {
            pause();
        }
    }

    if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();
        let step = (e.code === "ArrowRight") ? 10 : -10;
        let value = Math.min(Math.max(0, parseFloat(progressBar.value) + step), audioDuration);
        progressBar.value = value;

        switchTo(Math.max(0, parseFloat(progressBar.value)));

        // الشريط والوقت الحالي
        makeProgress();
    }
});

audio.addEventListener("play", () => {
    isPlaying = true;
    toPause();
});

audio.addEventListener("pause", () => {
    isPlaying = false;
    toPlay();
});

// القفز عبر الشريط
progressBar.addEventListener('input', () => {
    switchTo(Math.max(0, parseFloat(progressBar.value)));

    makeProgress();
});

function makeProgress() {
    // تقدم الوقت الحالي
    let elapsed = audio.currentTime || 0;
    formatTime(elapsed) != currentTimeEl.textContent ? currentTimeEl.textContent = formatTime(elapsed) : null;

    // تقدم الشريط
    let percent = (elapsed / audioDuration) * 100;
    progressBar.value = elapsed;
    progressBar.style.background = 
    `linear-gradient(to right, #1DB954 0%, #3deb7a ${percent}%, #444 ${percent}%, #444 100%)`;

    let bufferPercent = 0;

    // نهاية آخر جزء متحمل
    let bufferedEnd = audio.buffered.length 
      ? audio.buffered.end(audio.buffered.length - 1) 
      : 0;
    
    bufferPercent = (bufferedEnd / audioDuration) * 100;
    
    progressBar.style.background = `
      linear-gradient(to right, 
        #1DB954 0%, 
        #3deb7a ${percent}%, 
        #696969 ${percent}%, 
        #696969 ${bufferPercent}%, 
        #444 ${bufferPercent}%, 
        #444 100%
      )`;    
}

function switchTo(time) {
    audio.currentTime = time;
    if(isPlaying) {
        setTimeout(()=>audio.play().catch(()=>{}),50);
    }
}

// تغيير شكل الزر
function toPause(){
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
}

function toPlay(){
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
}
