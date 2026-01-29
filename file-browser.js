// File Browser System for World of Warships Ad Generator
// This version works with static files hosted on GitHub Pages

class FileBrowser {
    constructor() {
        this.currentPath = [];
        this.currentCallback = null;
        this.folderStructure = null;
        this.basePath = './'; // Base path where командиры and модули folders are located
    }

    // Initialize and load the folder structure
    async init() {
        // Load the folder structure from a JSON file
        // You'll need to create this file with your actual folder/file structure
        try {
            const response = await fetch('folder-structure.json');
            this.folderStructure = await response.json();
        } catch (error) {
            console.error('Failed to load folder structure:', error);
            console.log('Please create folder-structure.json file');
            this.folderStructure = this.getDefaultStructure();
        }
    }

    getDefaultStructure() {
        // This is just a placeholder - you'll replace this with folder-structure.json
        return {
            'командиры': {
                'США': [],
                'Япония': [],
                'Великобритания': [],
                'Германия': [],
                'СССР': [],
                'Франция': []
            },
            'модули': {
                '1': [],
                '2': [],
                '3': [],
                '4': []
            }
        };
    }

    // Open the file browser modal
    open(callback) {
        this.currentCallback = callback;
        this.currentPath = [];
        this.renderBrowser();
        document.getElementById('fileBrowserModal').style.display = 'flex';
    }

    // Close the browser
    close() {
        document.getElementById('fileBrowserModal').style.display = 'none';
        this.currentPath = [];
        this.currentCallback = null;
    }

    // Navigate to a folder
    navigate(folderName) {
        this.currentPath.push(folderName);
        this.renderBrowser();
    }

    // Go back one level
    goBack() {
        if (this.currentPath.length > 0) {
            this.currentPath.pop();
            this.renderBrowser();
        }
    }

    // Get current folder content
    getCurrentContent() {
        let current = this.folderStructure;
        for (let folder of this.currentPath) {
            current = current[folder];
            if (!current) return null;
        }
        return current;
    }

    // Get the actual file path for an image
    getImagePath(filename) {
        return this.basePath + this.currentPath.join('/') + '/' + filename;
    }

    // Render the browser UI
    renderBrowser() {
        const container = document.getElementById('fileBrowserContent');
        const breadcrumb = document.getElementById('fileBrowserBreadcrumb');
        
        // Update breadcrumb
        breadcrumb.innerHTML = '<span class="breadcrumb-item" onclick="fileBrowser.navigateToRoot()">Главная</span>';
        this.currentPath.forEach((folder, index) => {
            breadcrumb.innerHTML += ` / <span class="breadcrumb-item" onclick="fileBrowser.navigateToIndex(${index})">${folder}</span>`;
        });

        // Get current content
        const content = this.getCurrentContent();
        
        if (!content) {
            container.innerHTML = '<div class="file-browser-error">Ошибка загрузки папки</div>';
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Check if content is an array (list of files) or object (subfolders)
        if (Array.isArray(content)) {
            // This is the image level - show images
            this.renderImageLevel(container, content);
        } else {
            // Show folders
            const folders = Object.keys(content);
            if (folders.length === 0) {
                container.innerHTML = '<div class="file-browser-empty">Папка пуста</div>';
            } else {
                folders.forEach(folderName => {
                    const folderDiv = document.createElement('div');
                    folderDiv.className = 'file-browser-folder';
                    folderDiv.innerHTML = `
                        <div class="folder-icon">📁</div>
                        <div class="folder-name">${folderName}</div>
                    `;
                    folderDiv.onclick = () => this.navigate(folderName);
                    container.appendChild(folderDiv);
                });
            }
        }
    }

    renderImageLevel(container, imageFiles) {
        if (imageFiles.length === 0) {
            container.innerHTML = '<div class="no-images">В этой папке нет изображений</div>';
            return;
        }

        // Create images grid
        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'file-browser-images';
        container.appendChild(imagesGrid);

        imageFiles.forEach((filename, index) => {
            const imagePath = this.getImagePath(filename);
            
            const imageDiv = document.createElement('div');
            imageDiv.className = 'file-browser-image';
            imageDiv.innerHTML = `
                <img src="${imagePath}" alt="${filename}" onerror="this.parentElement.style.display='none'">
                <div class="image-name">${filename}</div>
                <div class="image-actions">
                    <button class="select-btn" onclick="fileBrowser.selectImage('${filename}')">Выбрать</button>
                </div>
            `;
            imagesGrid.appendChild(imageDiv);
        });
    }

    async selectImage(filename) {
        if (!this.currentCallback) return;

        const imagePath = this.getImagePath(filename);
        
        try {
            // Fetch the image and convert it to a blob
            const response = await fetch(imagePath);
            const blob = await response.blob();
            
            // Create image data object
            const imageData = {
                name: filename,
                blob: blob,
                path: imagePath
            };
            
            this.currentCallback(imageData);
            this.close();
        } catch (error) {
            console.error('Error loading image:', error);
            alert('Ошибка загрузки изображения');
        }
    }

    navigateToRoot() {
        this.currentPath = [];
        this.renderBrowser();
    }

    navigateToIndex(index) {
        this.currentPath = this.currentPath.slice(0, index + 1);
        this.renderBrowser();
    }

    openDeviceBrowser() {
        // Trigger the callback with null to indicate device browser should be used
        if (this.currentCallback) {
            this.currentCallback(null);
        }
        this.close();
    }
}

// Create global instance
const fileBrowser = new FileBrowser();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fileBrowser.init());
} else {
    fileBrowser.init();
}