const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const keywordsData = require('./keyword-urls.json');

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { keyword, selectedUrl } = JSON.parse(message);

    if (keyword) {
      const urls = keywordsData[keyword];
      if (urls) {
        ws.send(JSON.stringify({ type: 'urls', urls }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Keyword not found' }));
      }
    }

    if (selectedUrl) {
      downloadContent(selectedUrl, ws);
    }
  });
});

const downloadContent = async (url, ws) => {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;

    const writer = fs.createWriteStream(path.basename(url));
    response.data.on('data', (chunk) => {
      downloadedSize += chunk.length;
      writer.write(chunk);
      ws.send(JSON.stringify({
        totalSize,
        downloadedSize,
        progress: Math.floor((downloadedSize / totalSize) * 100)
      }));
    });

    response.data.on('end', () => {
      writer.end();
      ws.send(JSON.stringify({ type: 'completed' }));
    });

    response.data.on('error', (error) => {
      writer.close();
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    });
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
};

app.use(express.static(path.join(__dirname, '../client')));

server.listen(8080, () => {
  console.log('Server started on port 8080');
});
