let api_link = "https://youtube-to-mp3-api.duckdns.org";

let podcastsDiv = document.querySelector(".podcasts-div");
let audiosDiv = document.querySelector(".audios-div");
let circleDiv = document.querySelector(".circle-div");
let audioDiv = document.querySelector(".audio-div");

function showDiv(div_name) {
    podcastsDiv.style.display = "none";
    audiosDiv.style.display = "none";
    circleDiv.style.display = "none";
    audioDiv.style.display = "none";

    document.querySelector("." + div_name + "-div").style.display = "flex";
}

// ==================== الصوت ===================
const playButton = audioDiv.querySelector('#playBtn');
const progressBar = audioDiv.querySelector('.progress-bar');
const currentTimeEl = audioDiv.querySelector('.current-time');
const durationEl = audioDiv.querySelector('.duration');
const playIcon = audioDiv.querySelector('#playIcon');
const pauseIcon = audioDiv.querySelector('#pauseIcon');
const coverImg = audioDiv.querySelector(".cover-image img");
const audio = audioDiv.querySelector(".the-audio");
const audioTitle = audioDiv.querySelector(".audio-title");
const source = audio.querySelector("source");

// ==================== التنزيل ===================
const circleContainer = document.querySelector('.circle-container');
const circle = circleContainer.querySelector('circle');
const cancel = circleContainer.querySelector('.cancel-btn');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;

function setProgress(percent) {
    const minPercent = 1; // أقل نسبة عشان البوردر يبان
    let displayPercent = percent;

    if(percent < minPercent) {
        displayPercent = minPercent;
    }

    const offset = circumference - (displayPercent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    document.getElementById('percent-label').textContent = percent.toFixed(1) + '%';
}

function getYoutubeThumbnail(videoId) {
    const qualities = [
        "maxresdefault.jpg",
        "sddefault.jpg",
        "hqdefault.jpg",
        "mqdefault.jpg",
        "default.jpg"
    ];
  
    (function tryQuality(i) {
        if (i >= qualities.length) return;
        const img = new Image();
        img.onload = function () {
            if (this.naturalWidth > 120) {
                return this.src; // أول صورة شغالة
            } else {
                tryQuality(i + 1);
            }
        };

        img.onerror = function () {
            tryQuality(i + 1);
        };

        img.src = `https://img.youtube.com/vi/${videoId}/${qualities[i]}`;
    })(0);
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
        play();
    });

    showDiv("audio");
}

showDiv("podcasts");
// showDiv("circle");

let is_cancel = false;
circleContainer.onclick = () => {
    showDiv("audios");
    is_cancel = true;
    setTimeout(() => {
        is_cancel = false;
    }, 150);
}

// ================== API Fetch ===================
function openAudio(video_link, video_title, video_thumbnail) {
    showDiv("circle");

    audioTitle.textContent = video_title;
    coverImg.src = video_thumbnail;
    
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
                        if(is_cancel) return;
                        
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
}

podcastsDiv.onclick = (eo) => {
    let item = eo.target.closest(".podcast-item");
    console.log(item);
    if(item) {
        console.log(item);
        let link = item.dataset.link;
        let title = item.dataset.title;
        let thumbnail = item.dataset.thumbnail;
        let type = item.dataset.type;
        let condition = item.dataset.condition || "";
        
        audiosDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر
        showDiv("audios");

        if(type == "channel") {
            console.log(item);
            fetch(`${api_link}/channel?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=true`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('حدث خطأ:', data.error);
                    return;
                }

                console.log('عدد المقاطع في القناة:', data.length);
                data.forEach((video, index) => {
                    if (video.link && (condition != "" && video.title.includes(condition))) {
                        // استخراج videoId من الرابط
                        const thumbUrl = video.thumb;

                        // تكوين العنصر
                        const div = document.createElement("div");
                        div.className = "audio-item";
                        div.dataset.link = video.link;
                        div.dataset.title = video.title || "بدون عنوان";
                        div.dataset.thumbnail = thumbUrl;

                        div.innerHTML = `
                        <img src="${thumbUrl}" alt="Cover">
                        <h1 dir="rtl">${video.title || "بدون عنوان"}</h1>
                        `;

                        // إضافة للكونتينر
                        audiosDiv.appendChild(div);
                    }
                });
            })
            .catch(error => console.error('خطأ في الاتصال بـ API:', error));
        } else if(type == "playlist") {
            fetch(`${api_link}/playlist?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=true`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('حدث خطأ:', data.error);
                    return;
                }

                console.log('عدد المقاطع في القائمة:', data.length);
                data.forEach((video, index) => {
                    if (video.link && (condition == "" || video.title.includes(condition))) {
                        // استخراج videoId من الرابط
                        const thumbUrl = video.thumb;

                        // تكوين العنصر
                        const div = document.createElement("div");
                        div.className = "audio-item";
                        div.dataset.link = video.link;
                        div.dataset.title = video.title || "بدون عنوان";
                        div.dataset.thumbnail = thumbUrl;

                        div.innerHTML = `
                        <img src="${thumbUrl}" alt="Cover">
                        <h1 dir="rtl">${video.title || "بدون عنوان"}</h1>
                        `;

                        // إضافة للكونتينر
                        audiosDiv.appendChild(div);
                    }
                });
            })
            .catch(error => console.error('خطأ في الاتصال بـ API:', error));
            
        }
    }
}

audiosDiv.onclick = (eo) => {
    let item = eo.target.closest(".audio-item");
    if(item) {
        let link = item.dataset.link;
        let title = item.dataset.title;
        let thumbnail = item.dataset.thumbnail;

        openAudio(link, title, thumbnail);
    }
}

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
    let bufferedEnd = bufferedAhead(audio);
    bufferPercent = ((elapsed + bufferedEnd) / audioDuration) * 100;
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

function bufferedAhead(audio) {
    let current = audio.currentTime;
  
    for (let i = 0; i < audio.buffered.length; i++) {
      let start = audio.buffered.start(i);
      let end = audio.buffered.end(i);
  
      if (current >= start && current <= end) {
        return end - current; // المسافة المحملة قدام currentTime
      }
    }
  
    return 0; // مش موجود في أي range محمل
}

function switchTo(time) {
    audio.currentTime = time;
    if(isPlaying) {
        setTimeout(()=>audio.play().catch(()=>{}),50);
    }
}

// تغيير شكل الزر
function toPause() {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
}

function toPlay() {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
}