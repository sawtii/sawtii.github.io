let api_link = "https://youtube-to-mp3-api.duckdns.org";

// =================== الصفحات ======================
const podcastsDiv = document.querySelector(".podcasts-div");
const peopleDiv = document.querySelector(".people-div");
const coursesDiv = document.querySelector(".courses-div");
const audiosDiv = document.querySelector(".audios-div");
const circleDiv = document.querySelector(".circle-div");
const audioDiv = document.querySelector(".audio-div");

// =================== الرئيسة ====================
const homeBar = document.querySelector(".home");
const back = homeBar.querySelector(".back");
const downloads = homeBar.querySelector(".downloads");
const logo = homeBar.querySelector(".logo");

const footer = document.querySelector(".footer");
const footer_podcasts = footer.querySelector(".item.podcasts");
const footer_salasel = footer.querySelector(".item.salasel");
const footer_courses = footer.querySelector(".item.courses");
let active_page = "";
let download_mode = false;

// ==================== الصوت ===================
const coverImg = audioDiv.querySelector(".cover-image img");
const audioTitle = audioDiv.querySelector(".audio-title");
const audio = audioDiv.querySelector(".the-audio");
const source = audio.querySelector("source");
const playButton = audioDiv.querySelector("#playBtn");
const progressBar = audioDiv.querySelector(".progress-bar");
const currentTimeEl = audioDiv.querySelector(".current-time");
const durationEl = audioDiv.querySelector(".duration");
const playIcon = audioDiv.querySelector("#playIcon");
const pauseIcon = audioDiv.querySelector("#pauseIcon");
const speedsDiv = audioDiv.querySelector(".speeds");
const speeds = speedsDiv.querySelectorAll("div");

// ============== دائرة التنزيل ================
const circleContainer = document.querySelector(".circle-container");
const circle = circleContainer.querySelector("circle");
const cancel = circleContainer.querySelector(".cancel-btn");
const circle_audioTitle = circleDiv.querySelector("#circle-audio-title");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;

// ============== أزرار التنزيل ================
const downloadContainer = document.querySelector(".download-container");
const downloadButton = downloadContainer.querySelector(".download-btn");
const download_progressBar = downloadContainer.querySelector(".progress-bar");
const download_progressText = downloadContainer.querySelector(".progress-text");
const fileSizeCont = downloadContainer.querySelector(".download-btn-container");
const fileSize = downloadContainer.querySelector(".file-size");

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
let done_load_files = 0;
let podcasts_data = [];
let salasel_data = [];
let courses_data = [];

function load_files_data() {
    fetch("./بيانات/إذاعة.json")
        .then(response => response.json())
        .then(data => {
            podcasts_data = sortObjects(data);
            done_load_files += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));
        
    fetch("./بيانات/سلاسل.json")
        .then(response => response.json())
        .then(data => {
            salasel_data = sortObjects(data);
            done_load_files += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));

    fetch("./بيانات/محاضرون.json")
        .then(response => response.json())
        .then(data => {
            courses_data = sortObjects(data);
            done_load_files += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));
}

load_files_data();

// روابط الحلقات
let done_load_links = 0;
let podcasts_links = {};
let salasel_links = {};
let courses_links = {};
let all_links = {};

function load_links_data() {
    fetch(`${api_link}/data/podcasts.json`)
        .then(response => response.json())
        .then(data => {
            podcasts_links = data;
            done_load_links += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));
        
    fetch(`${api_link}/data/salasel.json`)
        .then(response => response.json())
        .then(data => {
            salasel_links = data;
            done_load_links += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));

    fetch(`${api_link}/data/courses.json`)
        .then(response => response.json())
        .then(data => {
            courses_links = data;
            done_load_links += 1;
        })
        .catch(error => console.error("❌ خطأ في الطلب:", error));
    
    let all_links_interval = setInterval(() => {
        if(done_load_links >= 3) {
            all_links = {...podcasts_links, ...salasel_links, ...courses_links};
            clearInterval(all_links_interval);
        }
    });
}

load_links_data();

// ============================================== دوال الرئيسية =============================================================
function refresh_page() { // إعادة تحميل الصفحة (خاصية إظهار التنزيلات)
    let activeDiv = document.querySelector(".active-div");
    let div_name = activeDiv.classList[1];

    if(div_name == "people-div") { // المحاضرات والسلاسل (الرئيسية)
        let type = activeDiv.dataset.type; // courses || salasel
        showDiv("people", type);
    } else if(div_name == "podcasts-div") { // الإذاعة (الرئيسية)
        showDiv("podcasts");
    } else if(div_name == "courses-div") { // (فرع)
        let course = activeDiv.dataset.name;
        let index = search_by_key(courses_data, "name", getParent(courses_data, course) || course);
        if(index >= 0) show_courses(courses_data[index]["courses"], download_mode);
        if(index < 0) {
            index = search_by_key(salasel_data, "name", getParent(salasel_data, course) || course);
            show_courses(salasel_data[index]["courses"], download_mode);
        }
    } else if(div_name == "audios-div") {
        show_audios(document.querySelector(`.choose-item[data-name="${activeDiv.dataset.name}"]`), download_mode);
    }
}

// الرجوع
function back_click() {
    downloads.style.display = "flex";

    if(active_page.includes("inner") || active_page == "podcasts audios") {
        active_footer_item(footer_index(footer.querySelector(`.item.${audioDiv.dataset.type}`)));
        back.style.display = "none";
    } else if(active_page.includes("audios")) {
        showDiv("courses");

        let name = audiosDiv.dataset.name;
        let type = audiosDiv.dataset.type;
        if(type == "courses") {
            active_page = "courses inner";
            let index = search_by_key(courses_data, "name", getParent(courses_data, name) || name);
            show_courses(courses_data[index]["courses"], download_mode);
        } else if(type == "salasel") {
            active_page = "salasel inner";
            let index = search_by_key(salasel_data, "name", getParent(salasel_data, name) || name);
            show_courses(salasel_data[index]["courses"], download_mode);
        }
    } else if(active_page.includes("audio")) {
        audio.querySelector("source").src = "";
        audio.load();

        footer.style.display = "";
        showDiv("audios");
        is_cancel = true;
        setTimeout(() => {
            is_cancel = false;
        }, 100);

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

// فهرس القائمة
function footer_index(item) {
    return Array.from(footer.querySelectorAll(".item")).indexOf(item);
}

// تفعيل قائمة
function active_footer_item(index) {
    let items = [footer_courses, footer_salasel, footer_podcasts];
    let item = items[index];
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

// مؤدي الدورة
function getParent(list, courseName) { // الداء والدواء => علاء حامد
    for (const parent of list) {
        if (parent.courses.some(c => c.name === courseName)) {
            return parent.name;
        }
    }

    return null;
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

        show_podcasts(download_mode);
    } else if(div_name == "people") {
        peopleDiv.dataset.type = info;
        coursesDiv.dataset.type = info;
        audiosDiv.dataset.type = info;
        audioDiv.dataset.type = info;

        show_people_of(info, download_mode);
    }
}

// إظهار محاضرو المحاضرات والسلاسل (الرئيسية)
function show_people_of(people_of = "courses|salasel", download_mode = false) {
    peopleDiv.innerHTML = "";
    
    let data = people_of == "courses"? courses_data : (people_of == "salasel"? salasel_data : "");
    if(download_mode) {
        for(let i in data) {
            let person = data[i];
            let has_any = false;

            for(let course_i in person.courses) {
                let course = person.courses[course_i];
                let condition = course.condition || "";
                
                isDownloaded(course.link, condition).then((is_data) => {
                    if(is_data) has_any = true;

                    if(course_i == person.courses.length - 1) {
                        if(has_any) { // لو الشخص لديه حلقات منزلة
                            peopleDiv.innerHTML += `
                            <div class="choose-item people-item" data-name="${person.name}" data-photo="${person.photo}">
                                <img src="${person.photo}" alt="Cover">
                                <h1 dir="rtl">${person.name}</h1>
                            </div>
                            `;
                        }

                        if(i == data.length - 1 && course_i == person.courses.length - 1 && peopleDiv.innerHTML == "") { // لو كان الشخص ليس لديه حلقات منزلة
                            peopleDiv.innerHTML = `<p style="text-align: center; padding: 50px; color: #999;">لا توجد حلقات منزلة هنا</p>`;
                        }

                        if(i == data.length - 1 && course_i == person.courses.length - 1) scrolling();
                    }
                });
            }
        }
    } else {
        for(let i in data) {
            let person = data[i];

            peopleDiv.innerHTML += `
            <div class="choose-item people-item" data-name="${person.name}" data-photo="${person.photo}">
                <img src="${person.photo}" alt="Cover">
                <h1 dir="rtl">${person.name}</h1>
            </div>
            `;
        }

        scrolling();
    }
}

// إظهار قائمة الإذاعة (الرئيسية)
function show_podcasts(download_mode = false) {
    podcastsDiv.innerHTML = "";
    
    if(download_mode) {
        for(let i in podcasts_data) {
            let item = podcasts_data[i];
            let condition = item.condition || "";
        
            isDownloaded(item.link, condition).then((is_data) => {
                if(is_data) { // لو الإذاعة فيها حلقات منزلة
                    podcastsDiv.innerHTML += `
                    <div class="choose-item podcast-item" data-type="${item.type}" data-name="${item.name}" data-condition="${item.condition || ""}" data-reverse="${item.reverse == true? true : false}" data-link="${item.link}" data-thumbnail="${item.thumbnail}">
                        <img src="${item.thumbnail}" alt="Cover">
                        <h1 dir="rtl">${item.name}</h1>
                    </div>
                    `;
                }

                
                if(i == podcasts_data.length - 1) {
                    if(podcastsDiv.innerHTML == "") { // لو كانت الإذاعة ليس فيها حلقات منزلة
                        podcastsDiv.innerHTML = `<p style="text-align: center; padding: 50px; color: #999;">لا توجد حلقات منزلة في أي إذاعة</p>`;
                    }

                    scrolling();
                }
            });
        }
    } else {
        for(let i in podcasts_data) {
            let item = podcasts_data[i];

            podcastsDiv.innerHTML += `
            <div class="choose-item podcast-item" data-type="${item.type}" data-name="${item.name}" data-condition="${item.condition || ""}" data-reverse="${item.reverse == true? true : false}" data-link="${item.link}" data-thumbnail="${item.thumbnail}">
                <img src="${item.thumbnail}" alt="Cover">
                <h1 dir="rtl">${item.name}</h1>
            </div>
            `;
        }

        scrolling();
    }

}

// إظهار قائمة الدورات (الفرع)
function show_courses(courses, download_mode = false) {
    coursesDiv.innerHTML = "";

    if(download_mode) {
        for(let i in courses) {
            let item = courses[i];
            
            let name = item.name;
            let type = item.type;
            let reverse = item.reverse || "false";
            let condition = item.condition || "";
            let link = item.link;
            let thumbnail = item.thumbnail;

            isDownloaded(link, condition).then((is_data) => {
                if(is_data) { // لو الدورة فيها حلقات منزلة
                    coursesDiv.innerHTML += `
                    <div class="choose-item course-item" data-type="${type}" data-name="${name}" data-reverse="${reverse}" data-link="${link}" data-thumbnail="${thumbnail}">
                        <img src="${thumbnail}" alt="Cover">
                        <h1 dir="rtl">${name}</h1>
                    </div>
                    `;
                }

                if(i == courses.length - 1 && coursesDiv.innerHTML == "") { // لو كانت الدورة ليس فيها حلقات منزلة
                    if(coursesDiv.dataset.type == "salasel") {
                        coursesDiv.innerHTML = `<p style="text-align: center; padding: 50px; color: #999;">لا توجد حلقات منزلة في أي سلسلة</p>`;
                    } else {
                        coursesDiv.innerHTML = `<p style="text-align: center; padding: 50px; color: #999;">لا توجد حلقات منزلة في أي دورة</p>`;
                    }
                }
                
                if(i == courses.length - 1) scrolling();
            });
        }
    } else {
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
}

// إظهار محاضرات الـ دورة/سلسلة/إذاعة
function show_audios(eo_target, download_mode = false) {
    let item = eo_target.closest(".choose-item");
    
    if(item) {
        let name = item.dataset.name;
        coursesDiv.dataset.name = name;
        audiosDiv.dataset.name = name;

        back.style.display = "flex";
        
        let link = item.dataset.link;
        let thumbnail = item.dataset.thumbnail;
        let type = item.dataset.type;
        let condition = item.dataset.condition || "";
        let reverse = item.dataset.reverse || "false";
        
        audiosDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر
        showDiv("audios");
        active_page = `${audioDiv.dataset.type} audios`;

        if(download_mode) {
            openDB().then(db => {
                const tx = db.transaction("audios", "readonly");
                tx.objectStore("audios").getAll().onsuccess = (e) => {
                    const downloadedFiles = e.target.result;
                    
                    // جلب جميع الحلقات أولاً
                    let allVideos = [];
                    
                    if(done_load_links >= 3 && JSON.stringify(all_links) != "{}") {
                        allVideos = all_links[link] || [];
                    }
                    
                    // عرض الحلقات المنزلة فقط
                    allVideos.forEach((video) => {
                        if (video.link) {
                            const videoId = video.link.split("/").pop().split("=").pop() + ".m4a";
                            const isDownloaded = downloadedFiles.some(f => f.fileName === videoId);
                            
                            if(isDownloaded && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {
                                const div = document.createElement("div");
                                div.classList.add("audio-item");
                                div.classList.add("choose-item");
                                div.classList.add("downloaded"); // 🆕 علامة للتمييز
                                div.dataset.link = video.link;
                                div.dataset.title = video.title || "بدون عنوان";

                                div.innerHTML = `
                                <img src="${thumbnail}" alt="Cover">
                                <h1 dir="rtl">${video.title || "بدون عنوان"}</h1>
                                `;

                                audiosDiv.appendChild(div);
                            }
                        }
                    });
                    
                    if(audiosDiv.children.length === 0) {
                        audiosDiv.innerHTML = `<p style="text-align: center; padding: 50px; color: #999;">لا توجد حلقات منزلة</p>`;
                    }
                    
                    scrolling();
                };
            });
            return; // إيقاف الباقي
        }

        if(done_load_links >= 3 && JSON.stringify(all_links) != "{}" && link in all_links) {
            all_links[link].forEach((video, index) => {
                if (video.link && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {

                    // // استخراج videoId من الرابط
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
        } else {
            if(type == "channel") {
                fetch(`${api_link}/channel?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=false`)
                .then(response => response.json())
                .then(data => {
                    audiosDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر
                    
                    if (data.error) {
                        console.error("حدث خطأ:", data.error);
                        return;
                    }

                    if(reverse == "true") {
                        data.reverse();
                    }
                    
                    console.log("عدد المقاطع في القناة:", data.length);
                    data.forEach((video, index) => {
                        if (video.link && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {
                            // // استخراج videoId من الرابط
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
                .catch(error => console.error("خطأ في الاتصال بـ API:", error));
            } else if(type == "playlist") {
                fetch(`${api_link}/playlist?url=${encodeURIComponent(link)}&links=true&titles=true&thumb=false`)
                .then(response => response.json())
                .then(data => {
                    audiosDiv.innerHTML = ""; // نفرّغ المكان قبل ما نضيف العناصر

                    if (data.error) {
                        console.error("حدث خطأ:", data.error);
                        return;
                    }

                    if(reverse == "true") {
                        data.reverse();
                    }
                    
                    console.log("عدد المقاطع في القائمة:", data.length);
                    data.forEach((video, index) => {
                        if (video.link && (video.title.includes("[Deleted video]") || video.title.includes("[Private video]")) == false && (condition == "" || video.title.includes(condition))) {
                            // // استخراج videoId من الرابط
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
                .catch(error => console.error("خطأ في الاتصال بـ API:", error));
                
            }
        }
    }
}

// ========================================= دوال تنزيل وعرض الصوت =====================================================
function setProgress(percent) { // تحميل الدائرة
    const minPercent = 1; // أقل نسبة عشان التحميل يبان
    let displayPercent = percent;

    if(percent < minPercent) {
        displayPercent = minPercent;
    }

    const offset = circumference - (displayPercent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    document.getElementById("percent-label").textContent = percent.toFixed(1) + "%";
}

// وضع الصورة المصغرة
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

// تحميل الصوت وعرضه
async function loadAudio(link, want_play = true) {
    source.src = link;
    audio.load();

    // عرض مدة الصوت
    new Promise(resolve => {
        audio.onloadedmetadata = () => resolve(audio.duration || 0);
        audio.onerror = () => resolve(0);
    }).then(duration => {
        audioDuration = duration;
        progressBar.max = Math.floor(audioDuration);
        durationEl.textContent = formatTime(audioDuration);
        if(want_play) play();

        active_speed(speedsDiv.querySelector(".active"));
        showDiv("audio");
    });

    // محاولة معرفة الحجم
    try {
        let sizeBytes = 0;

        if (link.startsWith("blob:")) { // متنزل
            const res = await fetch(link);
            const blob = await res.blob();
            sizeBytes = blob.size;

            downloadContainer.style.display = "none";
        } else { // مش متنزل
            const resp = await fetch(link, { method: "HEAD" });
            sizeBytes = +resp.headers.get("Content-Length") || 0;
        }

        if (sizeBytes > 0 && !link.startsWith("blob:")) {
            const sizeMB = formatMB(sizeBytes);
            fileSize.textContent = `${sizeMB}MB`;
            downloadContainer.style.display = "flex"; // تأكد إن العنصر ظاهر
            fileSizeCont.style.display = "flex"; // تأكد إن العنصر ظاهر
        }
    } catch (e) {
        console.warn("تعذر معرفة حجم الملف:", e);
    }

}

// تنزيل المحاضرة وعرضها -- الأصل
function openAudio(video_link, video_title) {
    audioTitle.textContent = video_title;
    setYoutubeThumbnail(video_link.split("=").pop().split("&")[0]);
    
    let file_name = video_link.split("/").pop().split("=").pop() + ".m4a";
    isAudioSaved(file_name).then(exists => {
        if (exists) {
            // موجود بالفعل
            console.log("الصوت موجود بالفعل، تشغيل من IndexedDB");
            loadAndPlay(file_name);
            return;
        } else {
            circle_audioTitle.innerText = video_title;
            downloads.style.display = "none";
            showDiv("circle");

            setProgress(0);
            fetch(`${api_link}/url?link=${video_link}`)
                .then(response => response.json())
                .then(data => {
                    console.log("✅ النتيجة:", data);
    
                    if (
                        data.status &&
                        data.status.status === "done"
                    ) {
                        let fileLinks = data.status.whole_file.map(f => `${api_link}/${f}`);
                        downloadContainer.style.display = "flex";
                        loadAudio(fileLinks[0]);
                    } else if (data.download_id) {       
                        const downloadId = data.download_id;
            
                        console.log("not done");
                        const checkStatus = () => {
                            fetch(`${api_link}/status/${downloadId}`)
                            .then(res => res.json())
                            .then(statusData => {
                                console.log("in status", is_cancel);
                                if(is_cancel) {
                                    is_cancel = false;
                                    return;
                                }

                                console.log("in status");
    
                                console.log("🔄 حالة التحميل:", statusData);
            
                                // ================= تحديث الدائرة فقط أثناء التنزيل =================
                                if (statusData.status && typeof statusData.status.progress === "number" && statusData.status.status !== "done downloading") {
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
    });
}

// تنسيق الوقت
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const sec = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
    } else {
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
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

// تشغيل وإيقاف
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

// تغيير تقدم الشريط
function makeProgress() {
    // تقدم الوقت الحالي
    let elapsed = Math.floor(audio.currentTime) || 0;
    formatTime(elapsed) != currentTimeEl.textContent ? currentTimeEl.textContent = formatTime(elapsed) : null;

    // تقدم الشريط
    let percent = (elapsed / audioDuration) * 100;
    progressBar.value = elapsed;

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

// تغيير تقدم الصوت
function switchTo(time) {
    audio.currentTime = time;
    if(isPlaying) {
        setTimeout(()=>audio.play().catch(()=>{}),50);
    }
}

// الجزء المتوفر بدون شبكة
function bufferedAhead(audio) {
    let current = Math.floor(audio.currentTime) || 0;
  
    for (let i = 0; i < audio.buffered.length; i++) {
      let start = audio.buffered.start(i);
      let end = audio.buffered.end(i);
  
      if (current >= start && current <= end) {
        return end - current; // المسافة المحملة قدام currentTime
      }
    }
  
    return 0; // مش موجود في أي range محمل
}

// السرعات
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

// =================================================== الأصوات المنزلة ===================================================
async function getDownloaded() { // الأصوات المنزلة (id.m4a)
    const db = await openDB();
    const tx = db.transaction("audios", "readonly");
    const request = tx.objectStore("audios").getAllKeys();
    
    return new Promise((resolve) => {
        request.onsuccess = () => {
            // إزالة .m4a من كل fileName للحصول على video_id فقط
            const videoIds = request.result.map(fileName => fileName.replace(".m4a", "").split(".")[0]);
            resolve(videoIds);
        };
        request.onerror = () => resolve([]);
    });
}

// دالة للتحقق إذا كانت الإذاعة/الدورة/السلسلة تحتوي على حلقات منزلة
async function isDownloaded(listLink, condition = "") {
    const downloadedIds = await getDownloaded();
    
    // التحقق من all_links أولاً
    if(done_load_links >= 3 && all_links[listLink]) {
        const episodes = all_links[listLink];
        return episodes.some(video => {
            if(video.link && video.title.includes(condition)) {
                const videoId = video.link.split("/").pop().split("=").pop();
                return downloadedIds.includes(videoId);
            }

            return false;
        });
    }
    
    return false;
}

// ========================================== تنزيل الصوت ==========================================================
function openDB() { // فتح أو إنشاء قاعدة البيانات
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("audioDB", 1); // 1: رقم الإصدار
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("audios")) {
                const store = db.createObjectStore("audios", { keyPath: "fileName" });
                store.createIndex("title", "title", { unique: false });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// حجم الملف
async function get_file_size(url) {
    const resp = await fetch(url, { method: "HEAD" });
    if (!resp.ok) throw new Error("فشل في معرفة الحجم");
    const length = +resp.headers.get("Content-Length") || 0;
    return length; // بالبايت
}

// عدد الميجات المنزلة
function formatMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1); // رقم عشري واحد
}

// التأكد من وجود الملف
async function isAudioSaved(fileName) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("audios", "readonly");
        const req = tx.objectStore("audios").get(fileName);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
    });
}

// تنزيل وحفظ الملف مع شريط تقدم
async function saveAudioWithProgress(url, onProgress) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("فشل التحميل");
    const reader = resp.body.getReader();
    const length = +resp.headers.get("Content-Length") || 0;
    let received = 0, chunks = [];
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (length) {
            const percent = Math.round(received / length * 100);
            onProgress(percent, received, length);
        }
    }
    const blob = new Blob(chunks);
    const fileName = url.split("/").pop();

    // تخزين
    const title = audioTitle.textContent || fileName;
    const thumbnailUrl = coverImg?.src;
    let thumbBlob = null;
    if (thumbnailUrl) {
        try {
            const tResp = await fetch(thumbnailUrl);
            thumbBlob = await tResp.blob();
        } catch(e) {
            console.warn("فشل تحميل الصورة المصغرة:", e);
        }
    }

    const db = await openDB();
    const tx = db.transaction("audios", "readwrite");
    tx.objectStore("audios").put({ 
        fileName,
        blob,
        title,
        thumbnail: thumbBlob
    });

    return new Promise((res, rej) => {
        tx.oncomplete = () => res(fileName);
        tx.onerror = () => rej(tx.error);
    });
}

// تشغيل من IndexedDB
async function loadAndPlay(fileName, want_play = true) {
    const db = await openDB();
    const tx = db.transaction("audios","readonly");
    const req = tx.objectStore("audios").get(fileName);
    req.onsuccess = () => {
        if (req.result) {
            const url = URL.createObjectURL(req.result.blob);
            let last_time = audio.currentTime;
            loadAudio(url, want_play);
            audio.currentTime = last_time;

            // عرض الاسم
            if (req.result.title) {
                audioTitle.textContent = req.result.title;
                circle_audioTitle.innerText = req.result.title;
            }

            // عرض الصورة
            if (req.result.thumbnail) {
                const thumbUrl = URL.createObjectURL(req.result.thumbnail);
                coverImg.src = thumbUrl;
            }

            downloadContainer.style.display = "none";
        }
    };
}

downloadButton.onclick = async () => {
    fileSizeCont.style.display = "none";
    
    const src = audio.querySelector("source")?.src || audio.src;
    if (!src) return alert("مفيش مصدر صوت.");

    download_progressBar.style.display = "inline-block";
    download_progressText.style.display = "inline";

    try {
        const totalBytes = await get_file_size(src);
        const totalMB = formatMB(totalBytes);

        const fileName = await saveAudioWithProgress(src, (percent, received, length) => {
            const receivedMB = formatMB(received);
            const totalMBtxt = totalMB || formatMB(length);

            download_progressBar.value = percent;
            download_progressText.textContent = `${percent}% (${receivedMB}/${totalMBtxt}MB)`;
        });

        await loadAndPlay(fileName, !audio.paused);
    } catch (err) {
        alert("حصل خطأ: " + err.message);
    }
}

//  =============================================== النزول =========================================================
function show_when_scroll(element, top = 70, height = -50) { // إظهار عند النزول
    const windowHeight = window.innerHeight;
    const boxTop = element.getBoundingClientRect().top;
    if (boxTop + top < windowHeight + height && boxTop > 60) {
        element.classList.add("show");
    } else {
        element.classList.remove("show");
    }
}

function call_show_recusive(index, elements) {
    if(elements.length > 0) show_when_scroll(elements[index]);

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

// ============================================= الأحداث ============================================================
const after_download_files = setInterval(() => { // تفعيل قائمة
    if(done_load_files == 3) {
        active_footer_item(0);
        clearInterval(after_download_files);
    }
});
// showDiv("audio");

footer.querySelectorAll(".item").forEach(item => {
    item.onclick = () => {
        active_footer_item(footer_index(item));
        back.style.display = "none";
    }
});

// الصفحة الرئيسية
logo.onclick = () => {
    active_footer_item(footer_index(footer.querySelector(`.item.${audioDiv.dataset.type}`)));
    back.style.display = "none";
}

// التنزيلات
downloads.onclick = () => {
    if(download_mode) {download_mode = false; downloads.querySelector("img").src = "./صور/التنزيلات.png";}
    else {download_mode = true; downloads.querySelector("img").src = "./صور/الكل.png";}

    refresh_page();
}

// الرجوع
back.style.display = "none";
back.onclick = () => {
    back_click();
}

let is_cancel = false;
circleContainer.onclick = () => {
    downloads.style.display = "flex";

    showDiv("audios");
    active_page += "s";
    is_cancel = true;
    audio.querySelector("source").src = "";
    audio.load();
    footer.style.display = "";
    refresh_scrolling(audiosDiv.querySelectorAll(".choose-item"));
}

// ================== API Fetch ===================
peopleDiv.onclick = (eo) => {
    let item = eo.target.closest(".choose-item");
    if(item) {
        back.style.display = "flex";

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
            show_courses(courses_data[index]["courses"], download_mode);
        } else if(type == "salasel") {
            active_page = "salasel inner";
            let index = search_by_key(salasel_data, "name", name);
            show_courses(salasel_data[index]["courses"], download_mode);
        }
    }
}

podcastsDiv.onclick = (eo) => {show_audios(eo.target, download_mode);}
coursesDiv.onclick = (eo) => {show_audios(eo.target, download_mode);}

audiosDiv.onclick = (eo) => {
    active_page = `${audioDiv.dataset.type} audio`;
    footer.style.display = "none";

    let item = eo.target.closest(".audio-item");
    if(item) {
        let link = item.dataset.link;
        let title = item.dataset.title;
        downloads.style.display = "none";

        openAudio(link, title);
    }
}

// ==================== تشغيل الصوت ===================
let isPlaying = false;
let audioDuration = 0;

// زر التشغيل
playButton.addEventListener("click", () => {
    if(!isPlaying){
        play();
    } else {
        pause();
    }
});

// تقدم الشريط
setInterval(() => {
    if(audioDiv.style.display == "flex") {
        // الشريط والوقت الحالي
        makeProgress();

        // اقف لو وصلت للآخر
        if (Math.floor(audio.currentTime) >= Math.floor(audio.duration)) {
            pause();
        }
    }
}, 10);

// تشغيل الصوت من خارج الموقع
audio.addEventListener("play", () => {
    isPlaying = true;
    toPause();
});

// إيقاف الصوت من خارج الموقع
audio.addEventListener("pause", () => {
    isPlaying = false;
    toPlay();
});

// القفز عبر الشريط
progressBar.addEventListener("input", () => {
    switchTo(Math.max(0, parseFloat(progressBar.value))); // الصوت
    makeProgress(); // الشريط
});

// السرعات
active_speed(speeds[0]);

speedsDiv.onclick = (eo) => {
    if(eo.target != speedsDiv) {
        active_speed(eo.target);
    }
}

// التقديم والتأخير
document.querySelectorAll(".after-ten, .before-ten").forEach(element => {
    element.onclick = () => {
        let step = parseInt(element.textContent);
        let value = Math.min(Math.max(0, parseFloat(progressBar.value) + step), audioDuration);
        progressBar.value = value;

        switchTo(Math.max(0, parseFloat(progressBar.value))); // الصوت
        makeProgress(); // الشريط
    }
});

// التحكم بلوحة المفاتيح
document.addEventListener("keydown", function (event) {
    if(event.key == "Escape") { // الرجوع
        back_click();
    } else if(event.key == "ArrowRight" && ["podcasts", "salasel", "courses"].includes(active_page) && !audioDiv.classList.contains("active-div")) { // التنقل
        let index = (footer_index(footer.querySelector(".active")) - 1) % 3;
        index < 0? index += 3 : "";
        active_footer_item(index);
    } else if(event.key == "ArrowLeft" && ["podcasts", "salasel", "courses"].includes(active_page) && !audioDiv.classList.contains("active-div")) { // التنقل
        active_footer_item((footer_index(footer.querySelector(".active")) + 1) % 3);
    } else if(event.key == "ArrowRight" && audioDiv.classList.contains("active-div")) { // تقديم الصوت
        audioDiv.querySelector(".after-ten").click();
    } else if(event.key == "ArrowLeft" && audioDiv.classList.contains("active-div")) { // تأخير الصوت
        audioDiv.querySelector(".before-ten").click();
    } else if(event.key == " " && audioDiv.classList.contains("active-div")) { // تشغيل وإيقاف الصوت
        event.preventDefault();
        if (audio.paused) {
            if (Math.floor(audio.currentTime) >= Math.floor(audio.duration)) {
                audio.currentTime = 0;
            }

            play();
        } else {
            pause();
        }
    } else if("12345".includes(event.key) && audioDiv.classList.contains("active-div")) { // السرعات
        speeds["12345".indexOf(event.key)].click();
    }

    // خيار إظهار التنزيلات
    else if(event.code == "KeyD") {
        if(download_mode) {download_mode = false; downloads.querySelector("img").src = "./صور/التنزيلات.png";}
        else {download_mode = true; downloads.querySelector("img").src = "./صور/الكل.png";}

        refresh_page();
    }

    // اختيار
    else if(event.key == "ArrowUp") {
        console.log("Up Arrow pressed");
    } else if(event.key == "ArrowDown") {
        console.log("Down Arrow pressed");
    } else if(event.key == "Enter") {
        console.log("Enter pressed");
    }
});
