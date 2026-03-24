document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('toggleExtension');
  const status = document.getElementById('status');
  
  chrome.storage.sync.get(['enabled'], function(result) {
    const isEnabled = result.enabled !== false; // Default to true
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  });
  
  toggle.addEventListener('change', function() {
    const isEnabled = toggle.checked;
    
    chrome.storage.sync.set({ enabled: isEnabled }, function() {
      updateStatus(isEnabled);
    });
  });
  
  function updateStatus(isEnabled) {
    status.textContent = isEnabled ? 'Active' : 'Disabled';
    status.style.color = isEnabled ? '#4CAF50' : '#999';
  }
});
