const messages = [];


let devtoolsPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'devtools') {
    devtoolsPort = port;

    // Send existing messages when the panel connects
    port.postMessage({
      payload: messages,
      type: 'init',
    });
  }
});

function getParsedData(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}


chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'captured') {
    const data = getParsedData(msg.payload);
    const payload = {
      from: msg.from,
      ...data,
    };

    if (payload.from === 'sdk') {
      console.log('sdk', payload);
    }

    messages.push(payload);

    if (devtoolsPort) {
      // broadcast to devtools panels
      devtoolsPort.postMessage({
        payload,
        type: 'update',
      });
    }
  }
});
