const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function giải mã URL rút gọn
async function unshortenUrl(shortUrl) {
    try {
        const response = await axios.head(shortUrl);
        const longUrl = response.request.res.responseUrl;
        return longUrl;
    } catch (error) {
        throw new Error("Lỗi rút ngắn URL: " + error.message);
    }
}

// Function lấy ID của pin từ URL
async function getPinIdFromUrl(url) {
  try {
      let pinIdRegex;
      if (url.includes('pinterest.com/pin/')) {
          pinIdRegex = /\/pin\/(\d+)/;
      } else if (url.includes('pin.it')) {
          const fullUrl = await unshortenUrl(url);
          pinIdRegex = /\/pin\/(\d+)/;
          url = fullUrl; // Gán lại URL đã giải mã để tìm kiếm ID của pin
      } else {
          throw new Error("URL Pinterest không hợp lệ");
      }

      const pinIdMatch = url.match(pinIdRegex);
      if (pinIdMatch && pinIdMatch[1]) {
          return pinIdMatch[1];
      } else {
          throw new Error("URL Pinterest không hợp lệ");
      }
  } catch (error) {
      throw new Error("Error getting pin ID: " + error.message);
  }
}

app.get('/', (req, res) => {
  res.send('Hello! Tao la Dat ne');
});

app.get('/a', async (req, res) => {
  const { link } = req.query;
  if (!link) {
    return res.status(400).json({ error: 'Thiếu link lol ngu' });
  }

  try {
    const pinId = await getPinIdFromUrl(link);

    const response = await axios.get(`https://www.pinterest.com/resource/PinResource/get/?source_url=&data={"options":{"id":"${pinId}","field_set_key":"auth_web_main_pin","noCache":true,"fetch_visual_search_objects":true},"context":{}}&_=${Date.now()}`);

    if (response.data.resource_response) {
      res.json({ 
        data: response.data.resource_response,
        // a: response.data.resource_response.data.story_pin_data.pages,
        video: response.data.resource_response.data.videos,
        images: response.data.resource_response.data.images,
        carousel_data: response.data.resource_response.data.carousel_data,
      });
    } else {
      throw new Error("API Pinterest trả về phản hồi trống");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(error.response ? error.response.status : 500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
