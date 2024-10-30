let currentCourseIndex = 0;
let incompleteCourses = [];
let timerInterval;
let currentTab = null;
let isAutoOpenRunning = false;
let originalTab = null;
let openedCoursesCount = 0;
let statsData = {
  completed: 0,
  incomplete: 0,
  total: 0
};

function getRandomSeconds() {
  return Math.floor(Math.random() * (25 - 10 + 1)) + 10;
}

function updateUI(response) {
  if (response) {
    statsData = {
      completed: response.completed,
      incomplete: response.incomplete,
      total: response.total
    };
    
    document.getElementById('completed').textContent = statsData.completed;
    document.getElementById('incomplete').textContent = statsData.incomplete;
    document.getElementById('total').textContent = statsData.total;
    document.getElementById('openedCount').textContent = openedCoursesCount;
    
    incompleteCourses = response.courseList.incomplete;
    
    const homeworkList = document.getElementById('homeworkList');
    homeworkList.innerHTML = response.courseList.homework
      .map(course => `<div class="course-item homework">${course.title}</div>`)
      .join('');
    
    const completedList = document.getElementById('completedList');
    completedList.innerHTML = response.courseList.completed
      .map(course => `<div class="course-item completed">${course.title}</div>`)
      .join('');
    
    const incompleteList = document.getElementById('incompleteList');
    incompleteList.innerHTML = response.courseList.incomplete
      .map(course => `<div class="course-item incomplete">${course.title}</div>`)
      .join('');
  }
}

function updateStats() {
  statsData.completed++;
  statsData.incomplete--;
  
  document.getElementById('completed').textContent = statsData.completed;
  document.getElementById('incomplete').textContent = statsData.incomplete;
}

async function startAutoOpen() {
  console.log("Starting auto open...");
  
  const timerElement = document.getElementById('timer');
  console.log("Timer element:", timerElement);
  
  if (timerElement) {
    timerElement.style.display = 'block';
    timerElement.style.visibility = 'visible';
  }
  
  document.getElementById('autoOpen').style.display = 'none';
  document.getElementById('stopAutoOpen').style.display = 'inline-block';
  
  if (!isAutoOpenRunning || currentCourseIndex >= incompleteCourses.length) {
    timerElement.textContent = '所有课程已完成！';
    stopAutoOpen();
    return;
  }

  if (currentTab) {
    try {
      await chrome.tabs.remove(currentTab.id);
    } catch (e) {
      console.log('Tab already closed');
    }
  }

  if (originalTab) {
    await chrome.tabs.update(originalTab.id, { active: true });
    openedCoursesCount++;
    document.getElementById('openedCount').textContent = openedCoursesCount;
    updateStats();
  }

  const tab = await chrome.tabs.create({ 
    url: incompleteCourses[currentCourseIndex].url,
    active: false
  });
  currentTab = tab;

  let seconds = getRandomSeconds();
  console.log("Initial seconds:", seconds);

  if (timerElement) {
    timerElement.textContent = `${seconds}秒后打开下一个课程...`;
    console.log("Set initial timer text");
  }

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    seconds--;
    console.log("Countdown:", seconds);
    
    if (timerElement) {
      timerElement.textContent = `${seconds}秒后打开下一个课程...`;
    }
    
    if (seconds <= 0) {
      clearInterval(timerInterval);
      currentCourseIndex++;
      if (isAutoOpenRunning) {
        startAutoOpen();
      }
    }
  }, 1000);
}

function stopAutoOpen() {
  isAutoOpenRunning = false;
  clearInterval(timerInterval);
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.style.display = 'none';
  }
  document.getElementById('autoOpen').style.display = 'inline-block';
  document.getElementById('stopAutoOpen').style.display = 'none';
  if (currentTab) {
    chrome.tabs.remove(currentTab.id);
    currentTab = null;
  }
}

chrome.runtime.onMessage.addListener((response) => {
  updateUI(response);
});

document.getElementById('checkCourses').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'checkCourses' }, updateUI);
});

document.getElementById('autoOpen').addEventListener('click', async () => {
  console.log("Auto open button clicked");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  originalTab = tab;
  currentCourseIndex = 0;
  openedCoursesCount = 0;
  clearInterval(timerInterval);
  isAutoOpenRunning = true;
  
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.style.display = 'block';
    timerElement.style.visibility = 'visible';
  }
  
  startAutoOpen();
});

document.getElementById('stopAutoOpen').addEventListener('click', stopAutoOpen);