document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('upload-form');
    const uploadButton = document.getElementById('upload-button');
    const responseArea = document.getElementById('response-area');
    const responseContent = document.getElementById('response-content');
    const closeResponseButton = document.getElementById('close-response');
    const tokensRemainingElement = document.getElementById('tokens-remaining');
    const cooldownTimerElement = document.getElementById('cooldown-timer');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Initialize theme from localStorage
    initTheme();
    
    // Theme toggle functionality
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // Initialize theme function
    function initTheme() {
        // Check if theme preference is stored in localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply theme based on saved preference or system preference
        if (savedTheme === 'light') {
            applyLightTheme();
        } else if (savedTheme === 'dark' || prefersDark) {
            applyDarkTheme();
        } else {
            applyDarkTheme(); // Default to dark
        }
    }
    
    // Apply dark theme
    function applyDarkTheme() {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        
        // Update toggle button text
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun me-1"></i><span>Chế độ sáng</span>';
        }
    }
    
    // Apply light theme
    function applyLightTheme() {
        document.documentElement.setAttribute('data-bs-theme', 'light');
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        
        // Update toggle button text
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon me-1"></i><span>Chế độ tối</span>';
        }
    }
    
    // Toggle between themes
    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        
        if (currentTheme === 'dark') {
            applyLightTheme();
            showToast('Chế độ sáng đã kích hoạt', 'Bạn đã chuyển sang chế độ sáng');
        } else {
            applyDarkTheme();
            showToast('Chế độ tối đã kích hoạt', 'Bạn đã chuyển sang chế độ tối');
        }
        
        // Add fancy transition effect
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 1000);
    }
    
    // Animation and UI enhancements
    const animateCounts = () => {
        // Add count-up effect to tokens remaining
        const currentTokens = parseInt(tokensRemainingElement.textContent);
        if (currentTokens > 0) {
            animateValue(tokensRemainingElement, 0, currentTokens, 1000);
        }
    };

    // Run initial animations
    setTimeout(animateCounts, 300);
    
    // Add smooth appear animation to main elements
    document.querySelectorAll('.glow-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Close response area when the close button is clicked with fade out effect
    closeResponseButton.addEventListener('click', function() {
        responseArea.style.opacity = '0';
        responseArea.style.transform = 'translateY(10px)';
        setTimeout(() => {
            responseArea.style.display = 'none';
            responseArea.style.transform = 'translateY(0)';
        }, 300);
    });
    
    // Initialize cooldown timer if needed
    let cooldownRemaining = parseInt(cooldownTimerElement.textContent);
    let cooldownInterval = null;
    
    // Start the cooldown timer if there's a cooldown
    if (cooldownRemaining > 0) {
        startCooldownTimer();
    }
    
    // Enhanced file input with drag and drop functionality
    const fileInput = document.getElementById('file');
    const fileLabel = document.querySelector('.custom-file-label');
    const originalLabelText = fileLabel.innerHTML;
    const dropArea = document.getElementById('drop-area');
    const browseButton = document.getElementById('browse-files');
    const removeFileButton = document.getElementById('remove-file');
    const dropMessage = document.querySelector('.drop-message');
    const selectedFileArea = document.querySelector('.selected-file');
    const fileName = document.querySelector('.file-name');
    const fileSize = document.querySelector('.file-size');
    
    // Initialize password toggle functionality
    const togglePasswordButton = document.getElementById('toggle-password');
    const apikeyInput = document.getElementById('apikey');
    
    if (togglePasswordButton && apikeyInput) {
        togglePasswordButton.addEventListener('click', function() {
            const type = apikeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apikeyInput.setAttribute('type', type);
            
            // Change the icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                this.setAttribute('data-bs-original-title', 'Ẩn API Key');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.setAttribute('data-bs-original-title', 'Hiện API Key');
            }
            
            // Refresh tooltip if initialized
            const tooltip = bootstrap.Tooltip.getInstance(togglePasswordButton);
            if (tooltip) {
                tooltip.update();
            }
        });
    }
    
    // File browse button functionality
    if (browseButton) {
        browseButton.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // File remove button functionality
    if (removeFileButton) {
        removeFileButton.addEventListener('click', function() {
            fileInput.value = '';
            updateFileDisplay();
        });
    }
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', function() {
        updateFileDisplay();
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            updateFileDisplay();
        }
    }
    
    // Enhanced reset form button functionality
    const resetFormButton = document.getElementById('reset-form');
    
    if (resetFormButton) {
        resetFormButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default form reset
            
            // Show confirmation toast
            const confirmReset = confirm('Bạn có chắc chắn muốn đặt lại tất cả thông tin đã nhập?');
            
            if(confirmReset) {
                // Reset all form values
                uploadForm.reset();
                
                // Update file display
                updateFileDisplay();
                
                // Show toast message
                showToast('Đã đặt lại biểu mẫu', 'Tất cả thông tin đã được xóa');
                
                // Add visual feedback
                document.querySelectorAll('.form-floating').forEach(field => {
                    field.classList.add('reset-animation');
                    setTimeout(() => {
                        field.classList.remove('reset-animation');
                    }, 500);
                });
            }
        });
    }
    
    function updateFileDisplay() {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            // Show selected file area and hide drop message
            dropMessage.classList.add('d-none');
            selectedFileArea.classList.remove('d-none');
            
            // Update file information
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            
            // Add selected class to label
            fileLabel.classList.add('file-selected');
            
            // Add animation effect
            selectedFileArea.classList.add('animated-in');
            setTimeout(() => {
                selectedFileArea.classList.remove('animated-in');
            }, 500);
        } else {
            // Hide selected file area and show drop message
            dropMessage.classList.remove('d-none');
            selectedFileArea.classList.add('d-none');
            
            // Remove selected class from label
            fileLabel.classList.remove('file-selected');
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Form input focus effects
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
        });
    });
    
    // Save credentials checkbox functionality
    const saveCredentialsCheckbox = document.getElementById('save-credentials');
    const apikeyField = document.getElementById('apikey');
    const universeIdField = document.getElementById('universe_id');
    const placeIdField = document.getElementById('place_id');
    
    // Load saved credentials when page loads
    loadSavedCredentials();
    
    // Handle credentials saving
    if (saveCredentialsCheckbox) {
        saveCredentialsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Prompt user about security implications
                showToast(
                    'Lưu thông tin',
                    'Thông tin sẽ được lưu trên trình duyệt này. Không nên sử dụng trên máy tính công cộng.'
                );
            } else {
                // If unchecked, clear saved credentials
                clearSavedCredentials();
                showToast('Đã xóa thông tin đã lưu', 'Thông tin đã được xóa khỏi trình duyệt này');
            }
        });
    }
    
    function saveCredentials() {
        if (saveCredentialsCheckbox && saveCredentialsCheckbox.checked) {
            const credentials = {
                apikey: apikeyField.value,
                universe_id: universeIdField.value,
                place_id: placeIdField.value,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem('roblox_uploader_credentials', JSON.stringify(credentials));
            showToast('Đã lưu thông tin', 'Thông tin đã được lưu để sử dụng lần sau');
        }
    }
    
    function loadSavedCredentials() {
        const savedCredentials = localStorage.getItem('roblox_uploader_credentials');
        
        if (savedCredentials) {
            try {
                const credentials = JSON.parse(savedCredentials);
                const currentTime = new Date().getTime();
                const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
                
                // Only load credentials if they are less than a week old
                if (currentTime - credentials.timestamp < oneWeek) {
                    if (apikeyField) apikeyField.value = credentials.apikey || '';
                    if (universeIdField) universeIdField.value = credentials.universe_id || '';
                    if (placeIdField) placeIdField.value = credentials.place_id || '';
                    
                    if (saveCredentialsCheckbox) saveCredentialsCheckbox.checked = true;
                    
                    // Add visual feedback that credentials were loaded
                    document.querySelectorAll('.form-floating').forEach(field => {
                        if (field.querySelector('.form-control').value) {
                            field.classList.add('loaded-credentials');
                            setTimeout(() => {
                                field.classList.remove('loaded-credentials');
                            }, 1500);
                        }
                    });
                    
                    showToast('Đã tải thông tin', 'Thông tin đã được tải từ lần sử dụng trước');
                } else {
                    // Credentials are too old, clear them
                    clearSavedCredentials();
                }
            } catch (e) {
                console.error('Error loading saved credentials:', e);
                clearSavedCredentials();
            }
        }
    }
    
    function clearSavedCredentials() {
        localStorage.removeItem('roblox_uploader_credentials');
        if (saveCredentialsCheckbox) saveCredentialsCheckbox.checked = false;
    }

    // Handle form submission with enhanced feedback
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if we're in cooldown or out of tokens
        if (cooldownRemaining > 0) {
            showResponse(`<i class="fas fa-hourglass-half me-2"></i> Vui lòng đợi ${cooldownRemaining} giây trước khi tải lên tiếp.`, 'error');
            shakeElement(uploadButton);
            return;
        }
        
        if (parseInt(tokensRemainingElement.textContent) <= 0) {
            showResponse('<i class="fas fa-exclamation-triangle me-2"></i> Bạn đã sử dụng hết MT Token hôm nay.', 'error');
            shakeElement(uploadButton);
            return;
        }
        
        // Save credentials if checkbox is checked
        saveCredentials();
        
        // Enhanced button loading state
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<div class="spinner-container"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="ms-2">Đang tải lên...</span></div>';
        uploadButton.classList.add('uploading');
        
        // Create form data
        const formData = new FormData(uploadForm);
        
        // Add visual feedback - progress animation
        document.body.classList.add('uploading-active');
        
        // Send the upload request
        fetch('/upload_game', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Get the response text
            return response.text().then(text => {
                return {
                    status: response.status,
                    statusText: response.statusText,
                    text: text
                };
            });
        })
        .then(result => {
            // Handle the response with enhanced feedback
            let responseType = result.status >= 200 && result.status < 300 ? 'success' : 'error';
            let icon = responseType === 'success' ? 
                '<i class="fas fa-check-circle me-2"></i>' : 
                '<i class="fas fa-exclamation-circle me-2"></i>';
                
            showResponse(`${icon}${result.text}`, responseType);
            
            // Update tokens and cooldown with animation
            updateStatus(true);
            
            // Success animation if applicable
            if (responseType === 'success') {
                showSuccessConfetti();
            }
        })
        .catch(error => {
            // Handle errors with better visualization
            showResponse(`<i class="fas fa-times-circle me-2"></i> Lỗi: ${error.message}`, 'error');
        })
        .finally(() => {
            // Re-enable the upload button with transition
            setTimeout(() => {
                uploadButton.disabled = false;
                uploadButton.innerHTML = '<i class="fas fa-cloud-upload-alt me-2"></i>Tải lên game';
                uploadButton.classList.remove('uploading');
                document.body.classList.remove('uploading-active');
            }, 500);
        });
    });
    
    // Enhanced function to update status (tokens and cooldown) with animations
    function updateStatus(animate = false) {
        fetch('/check_status')
            .then(response => response.json())
            .then(data => {
                // Animate the token count changing if requested
                if (animate) {
                    const oldValue = parseInt(tokensRemainingElement.textContent);
                    const newValue = data.tokens_remaining;
                    if (oldValue !== newValue) {
                        animateValue(tokensRemainingElement, oldValue, newValue, 1000);
                    } else {
                        tokensRemainingElement.textContent = newValue;
                    }
                } else {
                    tokensRemainingElement.textContent = data.tokens_remaining;
                }
                
                // Update cooldown timer with visual indication
                cooldownRemaining = data.cooldown_remaining;
                cooldownTimerElement.textContent = cooldownRemaining;
                
                // Update the cooldown progress bar
                const cooldownProgress = document.getElementById('cooldown-progress');
                if (cooldownProgress && cooldownRemaining > 0) {
                    const progressBar = cooldownProgress.querySelector('.progress-bar');
                    const percentComplete = ((60 - cooldownRemaining) / 60) * 100;
                    progressBar.style.width = `${percentComplete}%`;
                    
                    // Change color as it completes
                    if (percentComplete > 75) {
                        progressBar.className = 'progress-bar bg-success';
                    } else if (percentComplete > 40) {
                        progressBar.className = 'progress-bar bg-info';
                    } else {
                        progressBar.className = 'progress-bar bg-primary';
                    }
                } else if (cooldownProgress) {
                    cooldownProgress.querySelector('.progress-bar').style.width = '0%';
                }
                
                // If we have a cooldown, start the timer with pulsing effect
                if (cooldownRemaining > 0) {
                    startCooldownTimer();
                }
                
                // Update the UI based on whether user can upload with smooth transitions
                if (!data.can_upload) {
                    uploadButton.disabled = true;
                    uploadButton.classList.add('disabled-state');
                    
                    if (data.tokens_remaining <= 0) {
                        uploadButton.innerHTML = '<i class="fas fa-ban me-2"></i>Hết Token';
                        uploadButton.classList.add('no-tokens');
                        
                        // Additional visual feedback
                        document.querySelector('.status-icon i.fas.fa-key').classList.add('text-danger');
                        showToast('Hết Token', 'Bạn đã sử dụng hết MT Token hôm nay. Vui lòng quay lại vào ngày mai.');
                    } else {
                        uploadButton.innerHTML = '<i class="fas fa-hourglass-half me-2"></i>Đang chờ...';
                        uploadButton.classList.add('in-cooldown');
                        uploadButton.classList.remove('no-tokens');
                        document.querySelector('.status-icon i.fas.fa-key').classList.remove('text-danger');
                    }
                } else {
                    uploadButton.disabled = false;
                    uploadButton.classList.remove('disabled-state', 'in-cooldown', 'no-tokens');
                    uploadButton.innerHTML = '<i class="fas fa-cloud-upload-alt me-2"></i>Tải lên game';
                    document.querySelector('.status-icon i.fas.fa-key').classList.remove('text-danger');
                    
                    // If we just came out of cooldown, show a notification
                    if (cooldownRemaining === 0 && data.tokens_remaining > 0) {
                        showToast('Sẵn sàng tải lên!', 'Bạn có thể tải lên game ngay bây giờ');
                    }
                }
            })
            .catch(error => {
                console.error('Error checking status:', error);
                showToast('Lỗi kết nối', 'Không thể cập nhật trạng thái. Vui lòng làm mới trang.');
            });
    }
    
    // Enhanced cooldown timer with visual feedback
    function startCooldownTimer() {
        // Clear any existing interval
        if (cooldownInterval) {
            clearInterval(cooldownInterval);
        }
        
        // Add visual indication that cooldown is active
        const statusIcon = cooldownTimerElement.closest('.status-item').querySelector('.status-icon');
        statusIcon.classList.add('pulsing');
        
        // Start new interval with smoother animation
        cooldownInterval = setInterval(() => {
            cooldownRemaining--;
            cooldownTimerElement.textContent = cooldownRemaining;
            
            // Add dramatic animation when time is running low
            if (cooldownRemaining <= 5 && cooldownRemaining > 0) {
                cooldownTimerElement.classList.add('ending-soon');
            }
            
            if (cooldownRemaining <= 0) {
                clearInterval(cooldownInterval);
                cooldownInterval = null;
                
                // Reset visual states
                statusIcon.classList.remove('pulsing');
                cooldownTimerElement.classList.remove('ending-soon');
                
                // Play a subtle sound effect when cooldown ends (optional)
                playSound('cooldown-complete');
                
                // Show a brief notification
                showToast('Sẵn sàng tải lên!', 'Bạn có thể tải lên game ngay bây giờ');
                
                // Update status to potentially re-enable the button
                updateStatus();
            }
        }, 1000);
    }
    
    // Enhanced response message display with animations and status indicators
    function showResponse(message, type) {
        responseContent.innerHTML = message;
        
        // Get the response status container
        const responseStatus = document.getElementById('response-status');
        const responseIcon = document.getElementById('response-icon');
        const responseTitle = document.getElementById('response-title');
        const responseSubtitle = document.getElementById('response-subtitle');
        const responseProgress = document.getElementById('response-progress');
        
        // Configure the status area based on response type
        if (responseStatus) {
            responseStatus.classList.remove('d-none');
            
            // Set appropriate status content
            if (type === 'success') {
                responseIcon.innerHTML = '<i class="fas fa-check-circle text-success fa-2x"></i>';
                responseTitle.textContent = 'Tải lên thành công';
                responseSubtitle.textContent = 'Game của bạn đã được tải lên Roblox';
                responseProgress.className = 'progress-bar bg-success';
                
                // Trigger confetti effect
                showSuccessConfetti();
            } else if (type === 'error') {
                responseIcon.innerHTML = '<i class="fas fa-exclamation-circle text-danger fa-2x"></i>';
                responseTitle.textContent = 'Lỗi tải lên';
                responseSubtitle.textContent = 'Đã xảy ra lỗi khi tải lên game của bạn';
                responseProgress.className = 'progress-bar bg-danger';
            }
            
            // Animate progress bar
            responseProgress.style.width = '0%';
            setTimeout(() => {
                responseProgress.style.transition = 'width 0.8s ease';
                responseProgress.style.width = '100%';
            }, 100);
        }
        
        // If already visible, animate out then in with new content
        if (responseArea.style.display === 'block') {
            responseArea.style.opacity = '0';
            responseArea.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                setResponseType();
                responseArea.style.opacity = '1';
                responseArea.style.transform = 'translateY(0)';
            }, 300);
        } else {
            // First time showing, just fade in
            responseArea.style.display = 'block';
            responseArea.style.opacity = '0';
            responseArea.style.transform = 'translateY(10px)';
            
            setResponseType();
            
            setTimeout(() => {
                responseArea.style.opacity = '1';
                responseArea.style.transform = 'translateY(0)';
            }, 10);
        }
        
        // Helper function to set response type styling
        function setResponseType() {
            // Set appropriate styling based on response type with enhanced visuals
            if (type === 'success') {
                responseContent.parentElement.className = 'card-body';
                responseArea.querySelector('.card-header').className = 'card-header bg-success d-flex justify-content-between align-items-center';
                // Show toast notification for successful upload
                showToast('Tải lên thành công', 'Game của bạn đã được tải lên Roblox thành công!');
            } else if (type === 'error') {
                responseContent.parentElement.className = 'card-body';
                responseArea.querySelector('.card-header').className = 'card-header bg-danger d-flex justify-content-between align-items-center';
                // Shake the response area to highlight the error
                shakeElement(responseArea.querySelector('.card'));
            }
        }
        
        // Scroll to response with smooth animation
        responseArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Update status every 30 seconds with fade transition
    const statusUpdateInterval = setInterval(updateStatus, 30000);
    
    // Helper function to animate counting
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            obj.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // Helper function to shake an element (for errors)
    function shakeElement(element) {
        element.classList.add('shake-animation');
        setTimeout(() => {
            element.classList.remove('shake-animation');
        }, 820);
    }
    
    // Simulate a sound effect (can be implemented with actual sounds)
    function playSound(soundName) {
        // This is a placeholder - you would implement actual sounds here
        console.log(`Playing sound: ${soundName}`);
    }
    
    // Toast notification function
    function showToast(title, message) {
        // Create toast element
        const toastEl = document.createElement('div');
        toastEl.className = 'toast-notification';
        toastEl.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-bell me-2"></i>
                <strong>${title}</strong>
                <button type="button" class="btn-close ms-auto"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        // Add to document
        document.body.appendChild(toastEl);
        
        // Animate in
        setTimeout(() => {
            toastEl.classList.add('show');
        }, 10);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        }, 3000);
        
        // Close button functionality
        toastEl.querySelector('.btn-close').addEventListener('click', () => {
            toastEl.classList.remove('show');
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        });
    }
    
    // Simple confetti effect for successful uploads
    function showSuccessConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        
        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        // Remove after animation completes
        setTimeout(() => {
            confettiContainer.remove();
        }, 4000);
    }
    
    // Add some CSS for the new elements
    addDynamicStyles();
    
    function addDynamicStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .shake-animation {
                animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
            }
            
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
            
            .uploading {
                position: relative;
                overflow: hidden;
            }
            
            .uploading::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: loading-shine 1.5s infinite;
            }
            
            @keyframes loading-shine {
                100% { left: 100%; }
            }
            
            .spinner-container {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pulsing {
                animation: pulse-ring 1.5s infinite;
            }
            
            @keyframes pulse-ring {
                0% { box-shadow: 0 0 0 0 rgba(71, 118, 230, 0.5); }
                70% { box-shadow: 0 0 0 10px rgba(71, 118, 230, 0); }
                100% { box-shadow: 0 0 0 0 rgba(71, 118, 230, 0); }
            }
            
            .ending-soon {
                animation: blink 0.5s infinite;
            }
            
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
            
            .toast-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4776E6, #8E54E9);
                border-radius: 8px;
                padding: 0;
                color: white;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 1000;
                transition: all 0.3s ease;
                transform: translateY(100px);
                opacity: 0;
                max-width: 350px;
            }
            
            .toast-notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .toast-header {
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .toast-body {
                padding: 0.75rem 1rem;
            }
            
            .confetti-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9999;
            }
            
            .confetti {
                position: absolute;
                top: -10px;
                width: 10px;
                height: 20px;
                animation: confetti-fall 4s linear forwards;
            }
            
            @keyframes confetti-fall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            
            .file-selected {
                color: #4776E6;
                font-weight: bold;
            }
            
            .input-focused {
                transform: translateY(-2px);
                transition: transform 0.3s ease;
            }
        `;
        document.head.appendChild(styleEl);
    }
});
