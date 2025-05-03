document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('upload-form');
    const fileUpload = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');
    const processBtn = document.getElementById('process-btn');
    const processingStatus = document.getElementById('processing-status');
    const progressBar = document.getElementById('progress-bar');
    const statusMessage = document.getElementById('status-message');
    const resultsCard = document.getElementById('results-card');
    const resultFilename = document.getElementById('result-filename').querySelector('span');
    const textLength = document.getElementById('text-length');
    const embeddingSize = document.getElementById('embedding-size');
    const errorCard = document.getElementById('error-card');
    const errorMessage = document.getElementById('error-message');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const processAnotherBtn = document.getElementById('process-another-btn');
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    
    // Drag and drop functionality
    fileUploadWrapper.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('border-primary');
    });
    
    fileUploadWrapper.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('border-primary');
    });
    
    fileUploadWrapper.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('border-primary');
        
        if (e.dataTransfer.files.length) {
            fileUpload.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
    
    // Click to select file
    fileUploadWrapper.addEventListener('click', function(e) {
        if (e.target !== removeFileBtn) {
            fileUpload.click();
        }
    });
    
    // File selection
    fileUpload.addEventListener('change', handleFileSelect);
    
    function handleFileSelect() {
        const file = fileUpload.files[0];
        
        if (file) {
            // Validate file extension
            const extension = file.name.split('.').pop().toLowerCase();
            const validExtensions = ['pdf', 'docx', 'xlsx', 'xls'];
            
            if (!validExtensions.includes(extension)) {
                showError(`Invalid file type. Allowed types: ${validExtensions.join(', ')}`);
                resetFileUpload();
                return;
            }
            
            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                showError(`File too large. Maximum size is 5MB.`);
                resetFileUpload();
                return;
            }
            
            // Show file info
            fileName.textContent = file.name;
            fileInfo.classList.remove('d-none');
            processBtn.disabled = false;
        } else {
            resetFileUpload();
        }
    }
    
    // Remove selected file
    removeFileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetFileUpload();
    });
    
    // Reset file upload
    function resetFileUpload() {
        fileUpload.value = '';
        fileInfo.classList.add('d-none');
        fileName.textContent = '';
        processBtn.disabled = true;
    }
    
    // Form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileUpload.files[0]) {
            return;
        }
        
        // Show processing status
        uploadForm.classList.add('d-none');
        processingStatus.classList.remove('d-none');
        resultsCard.classList.add('d-none');
        errorCard.classList.add('d-none');
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) {
                progress = 90;
                clearInterval(progressInterval);
            }
            progressBar.style.width = `${progress}%`;
        }, 300);
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', fileUpload.files[0]);
        
        // Send request
        statusMessage.textContent = 'Uploading and processing document...';
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Show results
            setTimeout(() => {
                processingStatus.classList.add('d-none');
                resultsCard.classList.remove('d-none');
                
                // Update results
                resultFilename.textContent = data.filename;
                textLength.textContent = data.text_length;
                embeddingSize.textContent = data.embedding_size;
            }, 500);
        })
        .catch(error => {
            clearInterval(progressInterval);
            processingStatus.classList.add('d-none');
            showError(error.message);
        });
    });
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorCard.classList.remove('d-none');
    }
    
    // Try again button
    tryAgainBtn.addEventListener('click', function() {
        errorCard.classList.add('d-none');
        uploadForm.classList.remove('d-none');
        resetFileUpload();
    });
    
    // Process another document button
    processAnotherBtn.addEventListener('click', function() {
        resultsCard.classList.add('d-none');
        uploadForm.classList.remove('d-none');
        resetFileUpload();
    });
});
