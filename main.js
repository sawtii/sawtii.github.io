let api_link = "https://youtube-to-mp3-api.duckdns.org";

const podcastsDiv = document.querySelector(".podcasts-div");
const peopleDiv = document.querySelector(".people-div");
const coursesDiv = document.querySelector(".courses-div");
const audiosDiv = document.querySelector(".audios-div");
const circleDiv = document.querySelector(".circle-div");
const audioDiv = document.querySelector(".audio-div");
const speedsDiv = audioDiv.querySelector(".speeds");
const speeds = speedsDiv.querySelectorAll("div");

// دوال عامة
function search_by_key(arrOfObj, key, value) {
    for(let i in arrOfObj) {
        if(arrOfObj[i][key] == value) {
            return i;
        }
    }

    return -23;
}

function sortObjects(arr, key = "name") {
    arr.sort((a, b) => {
      if (typeof a[key] === "string") {
        return a[key].localeCompare(b[key]);
      } else {
        return a[key] - b[key];
      }
    });
  
    // بعد الترتيب، لو فيه arrays جوا العناصر نرتبهم برضه
    arr.forEach(obj => {
      if (Array.isArray(obj["courses"])) {
          // ترتيب العناصر الداخلية بالاسم مثلاً
          sortObjects(obj["courses"], "name");
      }
    });
  
    return arr;
}

// بيانات الملفات
let done_download_files = 0;
let podcasts_data = [];
let salasel_data = [];
let courses_data = [];

fetch("./بيانات/إذاعة.json")
    .then(response => response.json())
    .then(data => {
        podcasts_data = sortObjects(data);
        done_download_files += 1;
    })
    .catch(error => console.error("❌ خطأ في الطلب:", error));
    
fetch("./بيانات/سلاسل.json")
    .then(response => response.json())
    .then(data => {
        salasel_data = sortObjects(data);
        done_download_files += 1;
    })
    .catch(error => console.error("❌ خطأ في الطلب:", error));

fetch("./بيانات/محاضرون.json")
    .then(response => response.json())
    .then(data => {
        courses_data = sortObjects(data);
        done_download_files += 1;
    })
    .catch(error => console.error("❌ خطأ في الطلب:", error));

// الرجوع
function back_click() {
    if(active_page.includes("inner") || active_page == "podcasts audios") {
        active_footer_item(footer.querySelector(`.item.${audioDiv.dataset.type}`));
        back.style.display = "none";
    } else if(active_page.includes("audios")) {
        showDiv("courses");

        let name = audiosDiv.dataset.name;
        let type = audiosDiv.dataset.type;
        if(type == "courses") {
            active_page = "courses inner";
            let index = search_by_key(courses_data, "name", name);
            show_courses(courses_data[index]["courses"]);
        } else if(type == "salasel") {
            active_page = "salasel inner";
            let index = search_by_key(salasel_data, "name", name);
            show_courses(salasel_data[index]["courses"]);
        }
    } else if(active_page.includes("audio")) {
        audio.querySelector("source").src = "";
        audio.load();

        footer.style.display = "";
        showDiv("audios");
        is_cancel = true;

        if(audioDiv.dataset.type == "salasel") {
            active_page = "salasel audios";
        } else if(audioDiv.dataset.type == "courses") {
            active_page = "courses audios";
        } else if(audioDiv.dataset.type == "podcasts") {
            active_page = "podcasts audios";
        }

        refresh_scrolling(audiosDiv.querySelectorAll(".choose-item"));
    }
}

// إظهار قائمة: إذاعة - سلاسل - محاضرات
function showDiv(div_name, info = "") {
    let divs = [peopleDiv, podcastsDiv, coursesDiv, audiosDiv, circleDiv, audioDiv];
    divs.forEach(div => {
        div.style.display = "none";
        div.classList.remove("active-div");
    });

    document.querySelector("." + div_name + "-div").style.display = "flex";
    document.querySelector("." + div_name + "-div").classList.add("active-div");
    if(div_name == "podcasts") {
        podcastsDiv.dataset.type = div_name;
        audiosDiv.dataset.type = div_name;
        audioDiv.dataset.type = div_name;

        show_podcasts();
    } else if(div_name == "people") {
        peopleDiv.dataset.type = info;
        coursesDiv.dataset.type = info;
        audiosDiv.dataset.type = info;
        audioDiv.dataset.type = info;

        show_people_of(info);
    }
}

// إظهار قائمة الإذاعة
function show_podcasts() {
    podcastsDiv.innerHTML = "";
    for(let i in podcasts_data) {
        let item = podcasts_data[i];

        podcastsDiv.innerHTML += `
        <div class="choose-item podcast-item" data-type="${item.type}" data-name="${item.name}" data-reverse="${item.reverse == true? true : false}" data-link="${item.link}" data-thumbnail="${item.thumbnail}">
            <img src="${item.thumbnail}" alt="Cover">
            <h1 dir="rtl">${item.name}</h1>
        </div>
        `;
    }

    scrolling();
}

// إظهار محاضرو المحاضرات والسلاسل
function show_people_of(people_of = "courses|salasel") {
    peopleDiv.innerHTML = "";
    
    let data = people_of == "courses"? courses_data : (people_of == "salasel"? salasel_data : "");
    for(let i in data) {
        let item = data[i];

        peopleDiv.innerHTML += `
        <div class="choose-item people-item" data-name="${item.name}" data-photo="${item.photo}">
            <img src="${item.photo}" alt="Cover">
            <h1 dir="rtl">${item.name}</h1>
        </div>
        `;
    }

    scrolling();
}

// إظهار الدورات
function show_courses(courses) {
    coursesDiv.innerHTML = "";
    for(let i in courses) {
        let item = courses[i];
        
        let name = item.name;
        let type = item.type;
        let reverse = item.reverse || "false";
        let link = item.link;
        let thumbnail = item.thumbnail;

        coursesDiv.innerHTML += `
        <div class="choose-item course-item" data-type="${type}" data-name="${name}" data-reverse="${reverse}" data-link="${link}" data-thumbnail="${thumbnail}">
            <img src="${thumbnail}" alt="Cover">
            <h1 dir="rtl">${name}</h1>
        </div>
        `;
    }

    scrolling();
}

// إظهار محاضرات دورة/سلسلة/إذاعة
function show_audios(eo) {
    let item = eo.target.closest(".choose-item");

    if(item) {
        let link = item.dataset.link;
        let name = item.dataset.name;
        let thumbnail = item.dataset.thumbnail;
        let type = item.dataset.type;
        let condition = item.dataset.condition || "";
        let reverse = item.dataset.reverse || "false";
        
        audiosDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر
        showDiv("audios");
        active_page = `${audioDiv.dataset.type} audios`;

        if(type == "channel") {
            fetch(`${api_link}/channel?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=false`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('حدث خطأ:', data.error);
                    return;
                }

                if(reverse == "true") {
                    data.reverse();
                }
                
                console.log('عدد المقاطع في القناة:', data.length);
                data.forEach((video, index) => {
                    if (video.link && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {
                        // استخراج videoId من الرابط
                        // const thumbUrl = video.thumb;

                        // تكوين العنصر
                        const div = document.createElement("div");
                        div.classList.add("audio-item");
                        div.classList.add("choose-item");
                        div.dataset.link = video.link;
                        div.dataset.title = video.title || "بدون عنوان";
                        // div.dataset.thumbnail = thumbUrl;

                        div.innerHTML = `
                        <img src="${thumbnail}" alt="Cover">
                        <h1 dir="rtl">${video.title || "بدون عنوان"}</h1>
                        `;

                        // إضافة للحاوي
                        audiosDiv.appendChild(div);
                    }
                });

                scrolling();
            })
            .catch(error => console.error('خطأ في الاتصال بـ API:', error));
        } else if(type == "playlist") {
            fetch(`${api_link}/playlist?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=false`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('حدث خطأ:', data.error);
                    return;
                }

                if(reverse == "true") {
                    data.reverse();
                }
                
                console.log('عدد المقاطع في القائمة:', data.length);
                data.forEach((video, index) => {
                    if (video.link && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {
                        // استخراج videoId من الرابط
                        // const thumbUrl = video.thumb;

                        // تكوين العنصر
                        const div = document.createElement("div");
                        div.classList.add("audio-item");
                        div.classList.add("choose-item");
                        div.dataset.link = video.link;
                        div.dataset.title = video.title || "بدون عنوان";
                        // div.dataset.thumbnail = thumbUrl;

                        div.innerHTML = `
                        <img src="${thumbnail}" alt="Cover">
                        <h1 dir="rtl">${video.title || "بدون عنوان"}</h1>
                        `;

                        // إضافة للكونتينر
                        audiosDiv.appendChild(div);
                    }
                });

                scrolling();
            })
            .catch(error => console.error('خطأ في الاتصال بـ API:', error));
            
        }
    }
}

// تفعيل قائمة
function active_footer_item(item) {
    let class_name = item.classList[1];
    
    if(active_page != class_name) {
        footer.querySelectorAll(".item").forEach(item_to_del_active => {
            item_to_del_active.classList.remove("active");
        });

        item.classList.add("active");
        if(class_name == "podcasts") showDiv(class_name);
        else showDiv("people", class_name);

        active_page = class_name;
    }
}

// الثوابت
const homeBar = document.querySelector(".home");
const back = homeBar.querySelector(".back");
const logo = homeBar.querySelector(".logo");

const footer = document.querySelector(".footer");
const footer_podcasts = footer.querySelector(".item.podcasts");
const footer_salasel = footer.querySelector(".item.salasel");
const footer_courses = footer.querySelector(".item.courses");
let active_page = "";

// تفعيل قائمة
const after_download_files = setInterval(() => {
    if(done_download_files == 3) {
        active_footer_item(footer_courses);
        clearInterval(after_download_files);
    }
});
// showDiv("audio")

back.style.display = "none";
footer.querySelectorAll(".item").forEach(item => {
    item.onclick = () => {
        active_footer_item(item);
        back.style.display = "none";
    }
});

// الصفحة الرئيسية
logo.onclick = () => {
    active_footer_item(footer.querySelector(`.item.${audioDiv.dataset.type}`));
    back.style.display = "none";
}

back.onclick = () => {
    back_click();
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
const circle_audioTitle = circleDiv.querySelector("#circle-audio-title");
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

function setYoutubeThumbnail(videoId) {
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
                coverImg.src = this.src; // أول صورة شغالة
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

    active_speed(speedsDiv.querySelector(".active"));
    showDiv("audio");
}

let is_cancel = false;
circleContainer.onclick = () => {
    showDiv("audios");
    active_page += "s";
    is_cancel = true;
    audio.querySelector("source").src = "";
    audio.load();
    footer.style.display = "";
    refresh_scrolling(audiosDiv.querySelectorAll(".choose-item"));
}

// ================== API Fetch ===================
function openAudio(video_link, video_title) {
    circle_audioTitle.innerText = video_title;
    showDiv("circle");
    setProgress(0);

    audioTitle.textContent = video_title;
    setYoutubeThumbnail(video_link.split("=")[1].split("&")[0]);
    
    fetch(`${api_link}/url?link=${video_link}`)
        .then(response => response.json())
        .then(data => {
            console.log("✅ النتيجة:", data);
            if (data.download_id) {       
                console.log(data.status.status);         
                const downloadId = data.download_id;
    
                const checkStatus = () => {
                    fetch(`${api_link}/status/${downloadId}`)
                    .then(res => res.json())
                    .then(statusData => {
                        if(is_cancel) {
                            is_cancel = false;
                            return;
                        }

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

peopleDiv.onclick = (eo) => {
    back.style.display = "flex";
    
    let item = eo.target.closest(".choose-item");
    if(item) {
        let name = item.dataset.name;
        let photo = item.dataset.photo;
        let type = peopleDiv.dataset.type;
        
        coursesDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر
        coursesDiv.dataset.name = name;
        audiosDiv.dataset.name = name;
        showDiv("courses");

        if(type == "courses") {
            active_page = "courses inner";
            let index = search_by_key(courses_data, "name", name);
            show_courses(courses_data[index]["courses"]);
        } else if(type == "salasel") {
            active_page = "salasel inner";
            let index = search_by_key(salasel_data, "name", name);
            show_courses(salasel_data[index]["courses"]);
        }
    }
}

podcastsDiv.onclick = (eo) => {back.style.display = "flex"; show_audios(eo);}
coursesDiv.onclick = (eo) => {show_audios(eo);}

audiosDiv.onclick = (eo) => {
    active_page = `${audioDiv.dataset.type} audio`;
    footer.style.display = "none";

    let item = eo.target.closest(".audio-item");
    if(item) {
        let link = item.dataset.link;
        let title = item.dataset.title;

        openAudio(link, title);
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
    `linear-gradient(to right, #1DB954 0%, #3deb7a ${percent}%, #999 ${percent}%, #999 100%)`;

    let bufferPercent = 0;
    let bufferedEnd = bufferedAhead(audio);
    bufferPercent = ((elapsed + bufferedEnd) / audioDuration) * 100;
    progressBar.style.background = `
      linear-gradient(to right, 
        #1DB954 0%, 
        #3deb7a ${percent}%, 
        #bbb ${percent}%, 
        #bbb ${bufferPercent}%, 
        #999 ${bufferPercent}%, 
        #999 100%
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

// إظهار عند النزول
function show_when_scroll(element, top = 70, height = -50) {
    const windowHeight = window.innerHeight;
    const boxTop = element.getBoundingClientRect().top;
    if (boxTop + top < windowHeight + height && boxTop > 60) {
        element.classList.add("show");
    } else {
        element.classList.remove("show");
    }
}

function call_show_recusive(index, elements) {
    show_when_scroll(elements[index]);

    if(index+1 < elements.length) {
        setTimeout(() => {
            call_show_recusive(index+1, elements);
        }, 40 + index*20);
    }
}

function scrolling() {
    let boxes = document.querySelectorAll(".active-div .choose-item");
    call_show_recusive(0, boxes);

    window.addEventListener("scroll", () => {
        boxes.forEach(box => {
            show_when_scroll(box);
        });
    });
}

function refresh_scrolling(elements) {
    elements.forEach(element => {element.classList.remove("show")});
    call_show_recusive(0, elements);
}

// السرعات
active_speed(speeds[0]);

function del_active_speed() {
    speeds.forEach(element => {
        element.classList.remove("active");
    });
}

function active_speed(element) {
    del_active_speed();
    element.classList.add("active");
    audio.playbackRate = parseFloat(element.textContent);
}

speedsDiv.onclick = (eo) => {
    if(eo.target != speedsDiv) {
        console.log(eo.target);
        active_speed(eo.target);
    }
}