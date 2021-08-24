const socket = io();

// Grab elements
const leftButton = document.querySelector("#left-click");
const rightButton = document.querySelector("#right-click");
const trackpad = document.querySelector("#trackpad");
const textInput = document.querySelector("#text");

/********************************** Trackpad **********************************/
const lastPosition = {
  x: 0,
  y: 0,
};

// Pulls touch position information and scales against trackpad position and
// size. Final values should be between 0 and 1 if the event was within the
// trackpad
const computeScaledTrackpadPosition = (touchEvent) => {
  const boundingBox = trackpad.getBoundingClientRect();
  const dx = parseInt(touchEvent.changedTouches[0].clientX);
  const dy = parseInt(touchEvent.changedTouches[0].clientY);
  const scaledX = (dx - boundingBox.left) / (boundingBox.right - boundingBox.left);
  const scaledY = (dy - boundingBox.top) / (boundingBox.bottom - boundingBox.top);
  return { scaledX, scaledY };
};
trackpad.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const { scaledX, scaledY } = computeScaledTrackpadPosition(e);
  lastPosition.x = scaledX;
  lastPosition.y = scaledY;
});
trackpad.addEventListener("touchmove", (e) => {
  e.preventDefault();

  // Grab trackpad position
  const { scaledX, scaledY } = computeScaledTrackpadPosition(e);
  if ((scaledX < 0 || scaledX > 1) || (scaledY < 0 || scaledY > 1)) {
    // Moved outside trackpad
    return;
  }
  const dx = lastPosition.x - scaledX;
  const dy = lastPosition.y - scaledY;
  socket.emit("move", `${dx},${dy}`);
  lastPosition.x = scaledX;
  lastPosition.y = scaledY;
});

/*********************************** Mouse ************************************/
const touchStart = (buttonChar, e) => {
  e.preventDefault();
  socket.emit("click", `d${buttonChar}`);
};
const touchEnd = (buttonChar, e) => {
  e.preventDefault();
  socket.emit("click", `u${buttonChar}`);
};

leftButton.addEventListener("touchstart", touchStart.bind(null, "l"));
leftButton.addEventListener("touchend", touchEnd.bind(null, "l"));
rightButton.addEventListener("touchstart", touchStart.bind(null, "r"));
rightButton.addEventListener("touchend", touchEnd.bind(null, "r"));

/************************************ Text ************************************/
textInput.addEventListener("keypress", (e) => {
  e.preventDefault();
  socket.emit("type", e.key);
});
