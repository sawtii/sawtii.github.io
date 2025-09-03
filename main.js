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
let audios = document.querySelectorAll(".audios audio");

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
function loadAudio(links) {
    const container = document.querySelector(".audios");
    container.innerHTML = "";

    if (Array.isArray(links)) {
        links.forEach((link, index) => {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "metadata";
            const source = document.createElement("source");
            source.src = link;
            source.type = "audio/mpeg";
            audio.appendChild(source);
            container.appendChild(audio);
            audio.load();
        });
    } else if (typeof links === "object") {
        Object.entries(links).forEach(([fileName, link], index) => {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "metadata";
            const source = document.createElement("source");
            source.src = link;
            source.type = "audio/mpeg";
            audio.appendChild(source);
            container.appendChild(audio);
            audio.load();
        });
    }

    audios = document.querySelectorAll(".audios audio");

    Promise.all(
        Array.from(audios).map(a => new Promise(resolve => {
            a.onloadedmetadata = () => resolve(a.duration || 0);
            a.onerror = () => resolve(0);
        }))
    ).then(durations => {
        cumulativeDurations = durations.reduce((acc, dur) => {
            const last = acc.length ? acc[acc.length - 1] : 0;
            acc.push(last + dur);
            return acc;
        }, []);
        totalDuration = cumulativeDurations[cumulativeDurations.length -1];
        progressBar.max = Math.floor(totalDuration);
        durationEl.textContent = formatTime(totalDuration);
    });

    circleDiv.style.display = "none";
    audioDiv.style.display = "flex";

    coverImg.src = `https://img.youtube.com/vi/${video_link.split("=")[1]}/maxresdefault.jpg`;
}


audioDiv.style.display = "none";
circleDiv.style.display = "flex";

// ================== API Fetch ===================
let api_link = "https://youtube-to-mp3-api.duckdns.org";
let tmpLoop = true;
let video_link = "https://www.youtube.com/watch?v=vZZDe_BHt8g";

fetch(`${api_link}/url?link=${video_link}`)
// fetch(`${api_link}/url?link=https://www.youtube.com/watch?v=vZZDe_BHt8g`)
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
                        statusData.status.status === "done downloading" &&
                        statusData.status.whole_file &&
                        tmpLoop == true
                    ) {
                        let fileLinks = statusData.status.whole_file.map(f => `${api_link}/${f}`);
                        loadAudio(fileLinks);
                        tmpLoop = false; // بعد كده ما نحدثش التقدم تاني
                        // مش هنرجع تاني هنا
                    } else if (
                        statusData.status &&
                        statusData.status.status === "done" &&
                        statusData.status.links &&
                        typeof statusData.status.links === "object"
                    ) {
                        loadAudio(statusData.status.links);
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
let currentAudioIndex = 0; // الصوت الحالي
let isPlaying = false;
let cumulativeDurations = []; // لو كل صوت 10 ثواني: arr[10,20,30]
let totalDuration = 0; // 30

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

// تحميل المدد

// زر التشغيل
playButton.addEventListener('click', () => {
    if(!isPlaying){
        toPause();
        isPlaying = true;
        playCurrent();
    } else {
        pauseAll();
        toPlay();
        isPlaying = false;
    }
});

function playCurrent() {
    if(currentAudioIndex >= audios.length) {
        // currentAudioIndex = audios.length - 1;
        isPlaying = false;
        toPlay();
        return;
    }

    let audio = audios[currentAudioIndex];
    audio.play().catch(()=>{});
    audio.onended = () => {
        currentAudioIndex++;
        playCurrent();
    };
}

function pauseAll() {
    audios.forEach(a => a.pause());
}

setInterval(() => {
    if(audioDiv.style.display == "flex") {
        // الشريط والوقت الحالي
        makeProgress();

        // اقف لو وصلت للآخر
        let lastIndex = audios.length - 1;
        if (
            currentAudioIndex === lastIndex &&
            Math.floor(audios[lastIndex].currentTime) >= Math.floor(audios[lastIndex].duration)
        ) {
            pauseAll();
            toPlay();
            isPlaying = false;
        }
    }
}, 100);

document.addEventListener("keydown", (e) => {
    let audio = audios[currentAudioIndex]; // الصوت الحالي
  
    if (e.code === "Space") {
        e.preventDefault(); // عشان ماينزلش صفحة
    
        if (audio.paused) {
            let lastIndex = audios.length - 1;
            if (
                currentAudioIndex >= lastIndex &&
                Math.floor(audios[lastIndex].currentTime) >= Math.floor(audios[lastIndex].duration)
            ) {
                currentAudioIndex = 0;
                audio = audios[currentAudioIndex]; // الصوت الحالي
                audio.currentTime = 0;
            }
   
            audio.play();
            isPlaying = true;
            toPause();
        } else {
            audio.pause();
            isPlaying = false;
            toPlay();
        }
    }

    if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();
        let step = (e.code === "ArrowRight") ? 10 : -10;
        let value = Math.min(Math.max(0, parseFloat(progressBar.value) + step), totalDuration);
        progressBar.value = value;

        // خل كل الأصوات التالية تبدأ من الأول
        makeNextZero();

        // الشريط والوقت الحالي
        makeProgress();
    }
});

audios.forEach(audio => {
    audio.addEventListener("play", () => {
        // console.log("تشغيل الصوت:", audio.id);
        isPlaying = true;
        toPause();
    });

    audio.addEventListener("pause", () => {
        // console.log("إيقاف الصوت:", audio.id);
        isPlaying = false;
        toPlay();
    });
});

// القفز عبر الشريط
progressBar.addEventListener('input', () => {
    // خل كل الأصوات التالية تبدأ من الأول
    makeNextZero();
    
    // الشريط والوقت الحالي
    makeProgress();
});

function makeProgress() {
    // تقدم الوقت الحالي
    let elapsed = 0;
    for(let i=0; i<currentAudioIndex; i++) elapsed += audios[i].duration || 0;
    if(audios[currentAudioIndex]) elapsed += audios[currentAudioIndex].currentTime;
    formatTime(elapsed) != currentTimeEl.textContent ? currentTimeEl.textContent = formatTime(elapsed) : null;

    // تقدم الشريط
    let percent = (elapsed / totalDuration) * 100;
    progressBar.value = elapsed;
    progressBar.style.background = 
    `linear-gradient(to right, #1DB954 0%, #3deb7a ${percent}%, #444 ${percent}%, #444 100%)`;

    let bufferPercent = 0;
    let audio = audios[currentAudioIndex];
    let bufferedEnd = audio.buffered.length;
    let elapsedBefore = currentAudioIndex === 0 ? 0 : cumulativeDurations[currentAudioIndex-1];
    bufferPercent = ((elapsed + bufferedEnd) / totalDuration) * 100;
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

// خل كل الأصوات التالية تبدأ من الأول
function makeNextZero(progressInput = true) {
    let value = parseFloat(progressBar.value);
    for (let i = 0; i < audios.length; i++) {
        if(value < cumulativeDurations[i]){
            let prev = i===0?0:cumulativeDurations[i-1];
            for(let j=i+1; j<audios.length; j++) {
                audios[j].currentTime = 0;
            }

            if(progressInput) {
                switchTo(i, Math.max(0, value - prev));
                if(isPlaying) {
                    playCurrent();
                }
            }

            break;
        }
    }
}

function switchTo(index, time) {
    pauseAll();
    currentAudioIndex = index;
    audios[index].currentTime = time;
    if(isPlaying) {
        setTimeout(()=>audios[index].play().catch(()=>{}),50);
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
