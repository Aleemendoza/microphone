const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);
    console.log('media', mediaRecorder);
    console.log('stream', stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function (e) {
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt('Enter a name for your sound clip?', 'My unnamed clip');

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');
      const deleteButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      if (clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
      console.log('blob', blob)
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function (e) {
        let evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }

      clipLabel.onclick = function () {
        const existingName = clipLabel.textContent;
        const newClipName = prompt('Enter a new name for your sound clip?');
        if (newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    }
  }

  let onError = function (err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
  console.log('getUserMedia not supported on your browser!');
}

const counterDiv = document.querySelector('#counter');
let counter = 0;
let locked = false;
function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  console.log('audio', audioCtx)

  const source = audioCtx.createMediaStreamSource(stream);
  console.log('source', source)


  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  //analyser.connect(audioCtx.destination);

  setInterval(draw(), 300)

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);
    var max = dataArray.reduce((a, b) => {
      return Math.max(a, b);
    });
    // console.log('dataArray', max, canvasCtx)

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;

    let mayores = [];

    for (let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT / 2;

      if (v > 1.6) {
        console.log('algo', v);
        mayores.push(v);
      }

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    if (mayores.length > 5 && !locked) {
      document.body.style.backgroundColor = 'red';
      locked = true;
      setTimeout(() => {
        document.body.style.backgroundColor = 'white';
        counterDiv.innerHTML = ++counter;
        locked = false
      }, 300)
    }



    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();