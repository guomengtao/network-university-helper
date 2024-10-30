function analyzeCourses() {
  const courseItems = document.querySelectorAll('.activityinstance');
  let completed = 0;
  let incomplete = 0;
  let courseList = { 
    completed: [], 
    incomplete: [], 
    homework: [] // 作业列表
  };
  
  courseItems.forEach(item => {
    const titleElement = item.querySelector('.instancename');
    const linkElement = item.querySelector('.aalink');
    
    if (titleElement && linkElement) {
      const title = titleElement.textContent.trim();
      const url = linkElement.href;
      
      // 排除文件类型的链接
      if (!url.includes('/mod/resource/') && !url.includes('/mod/folder/')) {
        const parentActivity = item.closest('.activity');
        const isIncomplete = parentActivity && parentActivity.querySelector('img[alt*="未完成"]') !== null;
        
        // 检查是否为作业（包含"权重"或"形考任务"）
        const isHomework = title.includes('权重') || title.includes('形考任务');
        
        const courseItem = {
          title: title,
          element: item,
          url: url
        };

        // 分类存储
        if (isHomework) {
          courseList.homework.push(courseItem);
          if (isIncomplete) incomplete++;
          else completed++;
        } else {
          if (isIncomplete) {
            incomplete++;
            courseList.incomplete.push(courseItem);
          } else {
            completed++;
            courseList.completed.push(courseItem);
          }
        }
      }
    }
  });

  return {
    completed,
    incomplete,
    total: courseItems.length,
    courseList
  };
}

// 添加刷新统计数据的函数
function refreshStats() {
  return analyzeCourses();
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkCourses' || request.action === 'refreshStats') {
    const stats = refreshStats();
    sendResponse(stats);
  }
  return true;
});

// 初始化时发送统计数据
chrome.runtime.sendMessage(analyzeCourses());