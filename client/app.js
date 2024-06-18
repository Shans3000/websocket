let ws;

function searchKeyword() {
  const keyword = document.getElementById('keyword').value;
  if (!keyword) return alert('Please enter a keyword');

  ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    ws.send(JSON.stringify({ keyword }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'urls') {
      displayUrls(message.urls);
    }

    if (message.type === 'progress') {
      displayProgress(message);
    }

    if (message.type === 'completed') {
      displayContent();
    }

    if (message.type === 'error') {
      alert(message.message);
    }
  };
}

function displayUrls(urls) {
  const urlsDiv = document.getElementById('urls');
  urlsDiv.innerHTML = '';
  urls.forEach((url) => {
    const button = document.createElement('button');
    button.textContent = url;
    button.onclick = () => downloadContent(url);
    urlsDiv.appendChild(button);
  });
}

function downloadContent(url) {
  ws.send(JSON.stringify({ selectedUrl: url }));
}

function displayProgress({ totalSize, downloadedSize, progress }) {
  const progressDiv = document.getElementById('progress');
  progressDiv.innerHTML = `Progress: ${progress}% (${downloadedSize}/${totalSize} bytes)`;
}

function displayContent() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = 'Download completed. Check your project directory for the downloaded file.';
}
