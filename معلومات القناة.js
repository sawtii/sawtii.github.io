let apiUrl = 'https://youtube-to-mp3-api.duckdns.org';

let channelUrl = 'https://www.youtube.com/@Waie/videos';
fetch(`${apiUrl}/channel?url=${encodeURIComponent(channelUrl)}&links=true&titles=true`)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
        console.error('حدث خطأ:', data.error);
        return;
    }

    console.log('عدد الفيديوهات في القناة:', data.length);
    data.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title || 'بدون عنوان'}`);
        console.log(`رابط الفيديو: ${video.link || 'غير متوفر'}`);
    });
  })
  .catch(error => console.error('خطأ في الاتصال بـ API:', error));

let playlistUrl = 'https://www.youtube.com/playlist?list=PL1i_D1Vw3d5MkevimMdJRVLi4TiVFd-wE';
fetch(`${apiUrl}/playlist?url=${encodeURIComponent(playlistUrl)}&links=true&titles=true`)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
        console.error('حدث خطأ:', data.error);
        return;
    }

    console.log('عدد الفيديوهات في البلايليست:', data.length);
    data.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title || 'بدون عنوان'}`);
    console.log(`رابط الفيديو: ${video.link || 'غير متوفر'}`);
    });
  })
  .catch(error => console.error('خطأ في الاتصال بـ API:', error));

let videoUrl = 'https://www.youtube.com/watch?v=Vm8wjI3g2gU';
fetch(`${apiUrl}/video?url=${encodeURIComponent(videoUrl)}&title=true&description=true`)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error('حدث خطأ:', data.error);
      return;
    }

    console.log('العنوان:', data.title || 'بدون عنوان');
    console.log('الوصف:', data.description || 'بدون وصف');
  })
  .catch(error => console.error('خطأ في الاتصال بـ API:', error));
