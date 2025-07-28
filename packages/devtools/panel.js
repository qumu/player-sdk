const tbody = document.getElementById('log');

let allMessages = [];

function render() {
  tbody.innerHTML = '';

  console.log(allMessages.filter((msg) => msg.version === 3));

  allMessages
    .filter((msg) => msg.version === 3)
    .forEach((msg) => {
      const tr = document.createElement('tr');

      const fromTd = document.createElement('td');

      fromTd.innerText = msg.from;

      const actionTd = document.createElement('td');

      actionTd.innerText = msg.action;

      const nameTd = document.createElement('td');

      nameTd.innerText = msg.name || '';

      const valueTd = document.createElement('td');

      valueTd.innerText = msg.value || '';

      const versionTd = document.createElement('td');

      versionTd.innerText = msg.version;

      tr.appendChild(fromTd);
      tr.appendChild(actionTd);
      tr.appendChild(nameTd);
      tr.appendChild(valueTd);
      tr.appendChild(versionTd);

      tbody.appendChild(tr);
    });
}

// Connect to background
const port = chrome.runtime.connect({
  name: 'devtools',
});

port.onMessage.addListener((msg) => {
  if (msg.type === 'init') {
    allMessages = msg.payload;
    render();
  } else if (msg.type === 'update') {
    allMessages.push(msg.payload);
    render();
  }
});


chrome.devtools.network.onNavigated.addListener(() => {
  console.log("The inspected page reloaded or navigated!");
  // You can clear your table or re-request messages
  allMessages = [];
  render();
});
