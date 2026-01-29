// Constants
const NATIONS = ["США", "Япония", "Великобритания", "Германия", "СССР", "Франция", "Пан-Азия", "Пан-Европа", "Содружество", "Пан-Америка"];
const LEVELS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "Легенда"];
const CLASSES = ["Эсминец", "Крейсер", "Линкор", "Авианосец"];
const STATUSES = ["Премиум корабль", "Прокачиваемый корабль"];
const OBTAINING_OPTIONS = ["Бесплатно", "Кампания", "Серебро", "Дублоны", "Глобальный опыт", "Сталь", "Контейнеры", "Лояльность"];

const OUTPUT_SIZES = {
    "1600x1600": [1600, 1600],
    "3200x3200": [3200, 3200],
    "4800x4800": [4800, 4800]
};

// Global state
let currentPhoto = null;
let currentPhotoDataURL = null;
let logoImage = null;
let currentTemplateType = 'new'; // 'new' or 'old'
let additionalPhotos = {
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null,
    photo5: null,
    photo6: null,
    photo7: null
};
let settings = {
    transforms: {},
    ship_name: "",
    nation: NATIONS[0],
    level: LEVELS[0],
    class: CLASSES[0],
    status: STATUSES[0],
    output_size: "1600x1600",
    template_type: "new",
    obtaining_options: {},
    custom_options: {
        NATIONS: [],
        LEVELS: [],
        CLASSES: [],
        STATUSES: []
    }
};

let currentModalType = null;
let updateTimeout = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    loadSettings();
    setupEventListeners();
    loadLogoImage();
    // Show template immediately on load
    updatePreview();
});

function loadLogoImage() {
    const img = new Image();
    img.onload = function() {
        logoImage = img;
        triggerPreviewUpdate();
    };
    img.onerror = function() {
        console.log('Logo image not found. Place logo.png in the same folder as index.html');
    };
    img.src = 'logo.png';
}

function initializeControls() {
    // Initialize selects
    populateSelect('nationSelect', NATIONS, settings.custom_options.NATIONS);
    populateSelect('levelSelect', LEVELS, settings.custom_options.LEVELS);
    populateSelect('classSelect', CLASSES, settings.custom_options.CLASSES);
    populateSelect('statusSelect', STATUSES, settings.custom_options.STATUSES);
    
    // Initialize checkboxes
    const checkboxContainer = document.getElementById('obtainingOptions');
    OBTAINING_OPTIONS.forEach(option => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `opt_${option}`;
        checkbox.value = option;
        
        const label = document.createElement('label');
        label.htmlFor = `opt_${option}`;
        label.textContent = option;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        checkboxContainer.appendChild(div);
        
        checkbox.addEventListener('change', triggerPreviewUpdate);
    });
}

function populateSelect(elementId, baseOptions, customOptions) {
    const select = document.getElementById(elementId);
    select.innerHTML = '';
    
    const allOptions = [...baseOptions, ...customOptions];
    allOptions.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        select.appendChild(optElement);
    });
}

function setupEventListeners() {
    // Photo uploads
    document.getElementById('photoUpload').addEventListener('change', (e) => handlePhotoUpload(e, 'main'));
    document.getElementById('photo1Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo1'));
    document.getElementById('photo2Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo2'));
    document.getElementById('photo3Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo3'));
    document.getElementById('photo4Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo4'));
    document.getElementById('photo5Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo5'));
    document.getElementById('photo6Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo6'));
    document.getElementById('photo7Upload').addEventListener('change', (e) => handlePhotoUpload(e, 'photo7'));
    
    // Text inputs
    document.getElementById('shipName').addEventListener('input', triggerPreviewUpdate);
    
    // Selects
    document.getElementById('nationSelect').addEventListener('change', triggerPreviewUpdate);
    document.getElementById('levelSelect').addEventListener('change', triggerPreviewUpdate);
    document.getElementById('classSelect').addEventListener('change', triggerPreviewUpdate);
    document.getElementById('statusSelect').addEventListener('change', triggerPreviewUpdate);
    document.getElementById('outputSize').addEventListener('change', handleResolutionChange);
    document.getElementById('templateType').addEventListener('change', handleTemplateChange);
    
    // Sliders for main image and card - REAL-TIME updates (no debounce)
    const sliders = ['cardScale', 'cardXOffset', 'cardYOffset', 'imageScale', 'imageXOffset', 'imageYOffset',
                     'image1Scale', 'image1XOffset', 'image1YOffset',
                     'image2Scale', 'image2XOffset', 'image2YOffset',
                     'image3Scale', 'image3XOffset', 'image3YOffset',
                     'image4Scale', 'image4XOffset', 'image4YOffset',
                     'image5Scale', 'image5XOffset', 'image5YOffset',
                     'image6Scale', 'image6XOffset', 'image6YOffset',
                     'image7Scale', 'image7XOffset', 'image7YOffset'];
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        // Real-time update while dragging
        slider.addEventListener('input', function() {
            updateSliderValue(id);
            updatePreview(); // Direct call, no debounce
        });
    });
    
    // Make value displays editable
    sliders.forEach(id => {
        const valueSpan = document.getElementById(id + 'Value');
        if (valueSpan) {
            makeValueEditable(id, valueSpan);
        }
    });
    
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateFinalImage);
}

function makeValueEditable(sliderId, valueElement) {
    // Convert span to input field styled as text
    const input = document.createElement('input');
    input.type = 'text';
    input.id = valueElement.id;
    input.value = valueElement.textContent;
    input.style.cssText = 'width: 50px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #00ffff; text-align: right; padding: 2px 5px; border-radius: 4px; font-size: inherit;';
    
    input.addEventListener('input', function() {
        const slider = document.getElementById(sliderId);
        let val = parseFloat(this.value);
        
        if (!isNaN(val)) {
            // Clamp to slider min/max
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            val = Math.max(min, Math.min(max, val));
            
            slider.value = val;
            updateSliderValue(sliderId);
            updatePreview(); // Real-time update
        }
    });
    
    input.addEventListener('blur', function() {
        // Ensure value is formatted correctly on blur
        updateSliderValue(sliderId);
    });
    
    valueElement.parentNode.replaceChild(input, valueElement);
}

function handlePhotoUpload(event, photoType) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                if (photoType === 'main') {
                    currentPhoto = img;
                    currentPhotoDataURL = e.target.result;
                    document.getElementById('photoStatus').textContent = file.name;
                } else {
                    additionalPhotos[photoType] = img;
                    document.getElementById(`${photoType}Status`).textContent = file.name;
                }
                triggerPreviewUpdate();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueInput = document.getElementById(sliderId + 'Value');
    
    if (!valueInput) {
        console.error('Value input not found for:', sliderId);
        return;
    }
    
    if (sliderId.includes('Scale')) {
        valueInput.value = parseFloat(slider.value).toFixed(2);
    } else {
        valueInput.value = parseInt(slider.value);
    }
}

function triggerPreviewUpdate() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(updatePreview, 100);
}

function updatePreview() {
    // Always show template preview, even without main photo
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set preview canvas size (800x800 for preview)
    canvas.width = 800;
    canvas.height = 800;
    
    // Show canvas, hide placeholder
    canvas.style.display = 'block';
    document.getElementById('previewText').style.display = 'none';
    
    // Render the card
    renderCard(ctx, canvas.width, canvas.height, false);
}

function renderCard(ctx, width, height, isFinal = false) {
    const PREVIEW_SIZE = 800;
    const ratio = isFinal ? width / PREVIEW_SIZE : 1;
    
    // Clear canvas with background
    drawBackground(ctx, width, height);
    
    // Get transform values - DON'T multiply cardScale by ratio (it's already in the base dimensions)
    const cardScale = parseFloat(document.getElementById('cardScale').value);
    const cardX = parseFloat(document.getElementById('cardXOffset').value) * ratio;
    const cardY = parseFloat(document.getElementById('cardYOffset').value) * ratio;
    
    const imageScale = parseFloat(document.getElementById('imageScale').value);
    const imageX = parseFloat(document.getElementById('imageXOffset').value) * ratio;
    const imageY = parseFloat(document.getElementById('imageYOffset').value) * ratio;
    
    // Save context state
    ctx.save();
    
    // Draw card at center with proper scaling from center
    const baseCardWidth = 500 * ratio;
    const baseCardHeight = 580 * ratio;
    
    // Calculate the center point of the card (where it should be before any transformations)
    const cardCenterX = width / 2;
    const cardCenterY = height / 2;
    
    // Apply transformations: translate to center, add offset, scale from that point
    ctx.translate(cardCenterX + cardX, cardCenterY + cardY);
    ctx.scale(cardScale, cardScale);
    
    // Now draw the card centered on the origin (which is now at the scaled center point)
    const cardX_pos = -baseCardWidth / 2;
    const cardY_pos = -baseCardHeight / 2;
    
    drawCardElements(ctx, cardX_pos, cardY_pos, baseCardWidth, baseCardHeight, imageScale, imageX, imageY, ratio);
    
    // Restore context
    ctx.restore();
}

function drawBackground(ctx, width, height) {
    // ⚙️ USER PREFERRED SETTINGS
    const BACKGROUND_BRIGHTNESS = 0.1;  // ← User's preferred brightness
    
    // ⚙️ BACKGROUND PATTERN CONTROLS
    const PATTERN_OPACITY = 0.5;        // ← User's preferred pattern transparency
    const PATTERN_LINE_WIDTH = 0.7;      // ← User's preferred line thickness
    
    // ⚙️ GRADIENT COLOR PRESET - CHANGE THIS NUMBER TO SWITCH GRADIENTS!
    const GRADIENT_PRESET = 5;  // ← 1, 2, 3, 4, or 5
    
    // Calculate scale factor based on canvas size (800 is the preview base size)
    const scaleFactor = width / 800;
    
    // Helper to brighten colors
    function brightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 0xff) + Math.floor(amount * 255));
        const g = Math.min(255, ((num >> 8) & 0xff) + Math.floor(amount * 255));
        const b = Math.min(255, (num & 0xff) + Math.floor(amount * 255));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GRADIENT PRESETS - 5 Different Color Schemes
    // ═══════════════════════════════════════════════════════════════
    
    let gradientColors;
    
    if (GRADIENT_PRESET === 1) {
        // PRESET 1: Steel Ocean (navy blue + cold steel gray)
        gradientColors = [
            '#0b1c2d',  // Deep navy
            '#12324a',  // Battleship blue
            '#2f4f66',  // Steel blue
            '#12324a',  // Battleship blue
            '#0b1c2d'   // Deep navy
        ];
    }
    else if (GRADIENT_PRESET === 2) {
        // PRESET 2: Sonar Pulse (blue + muted cyan radar glow)
        gradientColors = [
            '#081a2b',  // Very dark blue
            '#0e2f45',  // Ocean blue
            '#1f5f6b',  // Sonar cyan
            '#0e2f45',  // Ocean blue
            '#081a2b'   // Very dark blue
        ];
    }
    else if (GRADIENT_PRESET === 3) {
        // PRESET 3: Atlantic Storm (blue + stormy green-gray)
        gradientColors = [
            '#0c1f2a',  // Storm navy
            '#183a4a',  // Deep sea blue
            '#2f5a5a',  // Storm green-gray
            '#183a4a',  // Deep sea blue
            '#0c1f2a'   // Storm navy
        ];
    }
    else if (GRADIENT_PRESET === 4) {
        // PRESET 4: Night Fleet (blue + cold violet accents)
        gradientColors = [
            '#0a1528',  // Midnight navy
            '#162a4a',  // Dark fleet blue
            '#2a2f5f',  // Cold violet-blue
            '#162a4a',  // Dark fleet blue
            '#0a1528'   // Midnight navy
        ];
    }
    else if (GRADIENT_PRESET === 5) {
        // PRESET 5: Arctic Command (blue + icy desaturated cyan)
        gradientColors = [
            '#0d2236',  // Arctic navy
            '#1a3f5f',  // Cold blue
            '#3f6f7a',  // Icy cyan
            '#1a3f5f',  // Cold blue
            '#0d2236'   // Arctic navy
        ];
    }

    else {
        // Fallback to preset 1
        gradientColors = ['#1a1a3a', '#1a1a4a', '#1a3a5a', '#1a2a4a', '#1a1a3a'];
    }
    
    // Create gradient background with selected preset
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, brightenColor(gradientColors[0], BACKGROUND_BRIGHTNESS));
    gradient.addColorStop(0.25, brightenColor(gradientColors[1], BACKGROUND_BRIGHTNESS));
    gradient.addColorStop(0.5, brightenColor(gradientColors[2], BACKGROUND_BRIGHTNESS));
    gradient.addColorStop(0.75, brightenColor(gradientColors[3], BACKGROUND_BRIGHTNESS));
    gradient.addColorStop(1, brightenColor(gradientColors[4], BACKGROUND_BRIGHTNESS));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add chaotic decorative line patterns
    ctx.save();
    ctx.lineWidth = PATTERN_LINE_WIDTH * scaleFactor;  // ← SCALED!
    
    // Seeded random for consistent pattern
    let seed = 12345;
    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
    
    // Chaotic angular lines scattered across canvas
    const lineCount = 80;
    for (let i = 0; i < lineCount; i++) {
        const startX = seededRandom() * width;
        const startY = seededRandom() * height;
        const angle = seededRandom() * Math.PI * 2;
        const length = (50 + seededRandom() * 200) * scaleFactor;  // ← SCALED!
        const opacity = PATTERN_OPACITY * (0.3 + seededRandom() * 0.7);
        
        ctx.strokeStyle = `rgba(100, 150, 255, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        ctx.stroke();
    }
    
    // Sharp geometric fragments - triangles and angular shapes
    const fragmentCount = 25;
    for (let i = 0; i < fragmentCount; i++) {
        const centerX = seededRandom() * width;
        const centerY = seededRandom() * height;
        const size = (20 + seededRandom() * 60) * scaleFactor;  // ← SCALED!
        const rotation = seededRandom() * Math.PI * 2;
        const sides = Math.floor(seededRandom() * 2) + 3; // 3 or 4 sides
        const opacity = PATTERN_OPACITY * (0.2 + seededRandom() * 0.5);
        
        ctx.strokeStyle = `rgba(80, 140, 255, ${opacity})`;
        ctx.beginPath();
        
        for (let j = 0; j <= sides; j++) {
            const angle = rotation + (j / sides) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * size;
            const y = centerY + Math.sin(angle) * size;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Scattered angled cross marks
    const crossCount = 35;
    for (let i = 0; i < crossCount; i++) {
        const x = seededRandom() * width;
        const y = seededRandom() * height;
        const size = (8 + seededRandom() * 25) * scaleFactor;  // ← SCALED!
        const angle = seededRandom() * Math.PI / 4; // Varying angles
        const opacity = PATTERN_OPACITY * (0.4 + seededRandom() * 0.6);
        
        ctx.strokeStyle = `rgba(120, 160, 255, ${opacity})`;
        
        // First line of cross
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.stroke();
        
        // Second line of cross (perpendicular)
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle + Math.PI/2) * size, y - Math.sin(angle + Math.PI/2) * size);
        ctx.lineTo(x + Math.cos(angle + Math.PI/2) * size, y + Math.sin(angle + Math.PI/2) * size);
        ctx.stroke();
    }
    
    // Thin connecting lines between random points
    const connectCount = 15;
    const points = [];
    for (let i = 0; i < connectCount; i++) {
        points.push({x: seededRandom() * width, y: seededRandom() * height});
    }
    
    ctx.strokeStyle = `rgba(90, 145, 255, ${PATTERN_OPACITY * 0.3})`;
    for (let i = 0; i < connectCount - 1; i++) {
        if (seededRandom() > 0.6) { // Only connect some points
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.stroke();
        }
    }
    
    // Small scattered dots at intersections
    ctx.fillStyle = `rgba(100, 150, 255, ${PATTERN_OPACITY * 1.2})`;
    for (let i = 0; i < 40; i++) {
        const x = seededRandom() * width;
        const y = seededRandom() * height;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 * scaleFactor, 0, Math.PI * 2);  // ← SCALED!
        ctx.fill();
    }
    
    ctx.restore();
}

function drawCardElements(ctx, x, y, cardWidth, cardHeight, imageScale, imageX, imageY, ratio) {
    // Route to the appropriate template based on currentTemplateType
    if (currentTemplateType === 'old') {
        drawOldTemplateCard(ctx, x, y, cardWidth, cardHeight, imageScale, imageX, imageY, ratio);
    } else {
        drawNewTemplateCard(ctx, x, y, cardWidth, cardHeight, imageScale, imageX, imageY, ratio);
    }
}

function drawOldTemplateCard(ctx, x, y, cardWidth, cardHeight, imageScale, imageX, imageY, ratio) {
    const borderRadius = 20 * ratio;
    
    // Enhanced card background with blue-tinted gradient (BRIGHTER)
    const gradient = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
    gradient.addColorStop(0, '#15152a');      // Brighter dark blue
    gradient.addColorStop(0.5, '#1f1f32');    // Brighter blue-gray
    gradient.addColorStop(1, '#252538');      // Brighter lighter blue-gray
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    
    // Add subtle radial glow from center (STRONGER)
    const centerX = x + cardWidth / 2;
    const centerY = y + cardHeight / 2;
    const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cardWidth * 0.6);
    radialGradient.addColorStop(0, 'rgba(30, 50, 90, 0.4)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGradient;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    
    // Add subtle tech grid pattern overlay (LARGER SPACING)
    ctx.save();
    ctx.strokeStyle = 'rgba(40, 80, 120, 0.15)';
    ctx.lineWidth = 0.5 * ratio;
    const gridSize = 60 * ratio;  // ← LARGER GRID (was 30)
    
    // Vertical lines
    for (let i = x; i < x + cardWidth; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + cardHeight);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let j = y; j < y + cardHeight; j += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, j);
        ctx.lineTo(x + cardWidth, j);
        ctx.stroke();
    }
    ctx.restore();
    
    // Card border
    ctx.strokeStyle = '#2a3a50';
    ctx.lineWidth = 2 * ratio;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.stroke();
    
    // Glow effect
    ctx.shadowColor = 'rgba(0, 255, 255, 0.3)';
    ctx.shadowBlur = 30 * ratio;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Top neon line
    const topLineGradient = ctx.createLinearGradient(x, y, x + cardWidth, y);
    topLineGradient.addColorStop(0, 'transparent');
    topLineGradient.addColorStop(0.5, '#00ffff');
    topLineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = topLineGradient;
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y);
    ctx.lineTo(x + cardWidth - borderRadius, y);
    ctx.stroke();
    
    // Corner decorations
    drawCornerDecorations(ctx, x, y, cardWidth, cardHeight, ratio);
    
    // Ship image area (centered, single large image)
    const imageAreaWidth = 450 * ratio;
    const imageAreaHeight = 253 * ratio;
    const imageAreaX = x + (cardWidth - imageAreaWidth) / 2;
    const imageAreaY = y + 25 * ratio;
    
    // Image area background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15 * ratio);
    ctx.fill();
    
    // Image area border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1 * ratio;
    roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15 * ratio);
    ctx.stroke();
    
    // Draw ship photo
    if (currentPhoto) {
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15 * ratio);
        ctx.clip();
        
        const imgCenterX = imageAreaX + imageAreaWidth / 2;
        const imgCenterY = imageAreaY + imageAreaHeight / 2;
        
        ctx.translate(imgCenterX + imageX, imgCenterY + imageY);
        ctx.scale(imageScale, imageScale);
        
        // Calculate dimensions to preserve aspect ratio
        const imgAspect = currentPhoto.width / currentPhoto.height;
        const areaAspect = imageAreaWidth / imageAreaHeight;
        
        let drawWidth, drawHeight;
        if (imgAspect > areaAspect) {
            // Image is wider - fit to width
            drawWidth = imageAreaWidth;
            drawHeight = imageAreaWidth / imgAspect;
        } else {
            // Image is taller - fit to height
            drawHeight = imageAreaHeight;
            drawWidth = imageAreaHeight * imgAspect;
        }
        
        ctx.drawImage(currentPhoto, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        
        ctx.restore();
    }
    
    // Ship name overlay gradient
    const overlayGradient = ctx.createLinearGradient(imageAreaX, imageAreaY + imageAreaHeight - 60 * ratio, imageAreaX, imageAreaY + imageAreaHeight);
    overlayGradient.addColorStop(0, 'transparent');
    overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = overlayGradient;
    
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15 * ratio);
    ctx.clip();
    ctx.fillRect(imageAreaX, imageAreaY + imageAreaHeight - 60 * ratio, imageAreaWidth, 60 * ratio);
    ctx.restore();
    
    // Ship name text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${22 * ratio}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10 * ratio;
    const shipName = document.getElementById('shipName').value || ' ';
    ctx.fillText(shipName, imageAreaX + imageAreaWidth / 2, imageAreaY + imageAreaHeight - 20 * ratio);
    ctx.shadowBlur = 0;
    
    // Info grid
    const gridY = imageAreaY + imageAreaHeight + 20 * ratio;
    drawInfoGrid(ctx, x, gridY, cardWidth, ratio);
    
    // Status section
    const statusY = gridY + 80 * ratio;
    drawStatusSection(ctx, x, statusY, cardWidth, ratio);
    
    // Acquisition section
    const acquisitionY = statusY + 80 * ratio;
    drawAcquisitionSection(ctx, x, acquisitionY, cardWidth, ratio);
    
    // Footer text
    ctx.fillStyle = '#ffffff';
    ctx.font = `${15 * ratio}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 2 * ratio;
    ctx.fillText('@armada_legends', x + cardWidth / 2, y + cardHeight - 25 * ratio);
    ctx.shadowBlur = 0;
}

function drawNewTemplateCard(ctx, x, y, cardWidth, cardHeight, imageScale, imageX, imageY, ratio) {
    /*
    ================================================================================
    SIZING AND POSITIONING GUIDE FOR IMAGE BLOCKS
    ================================================================================
    
    ⚙️ ADJUSTMENT CONTROLS - Change these numbers:
    
    1️⃣ BOTTOM 4 IMAGES VERTICAL SPACING:
       Line ~347: bottomRowTopGap = [20] * ratio      ← Gap ABOVE bottom 4 images
       Line ~348: bottomRowBottomGap = [20] * ratio   ← Gap BELOW bottom 4 images
       
    2️⃣ BOTTOM 4 IMAGES SIDE MARGINS (from template borders):
       Line ~349: bottomLeftMargin = [60] * ratio     ← Left margin
       Line ~350: bottomRightMargin = [60] * ratio    ← Right margin
       Higher numbers = more space from borders
       
    3️⃣ RIGHT 3 IMAGES VERTICAL POSITION (how high/low):
       Line ~412: rightGroupBottomMargin = [25] * ratio  ← Distance from info grid
       Higher number = moves UP, Lower number = moves DOWN
       
    4️⃣ LOGO IMAGE (top right):
       Line ~379: logoSize = [60] * ratio             ← Logo width/height
       Line ~380: logoTopMargin = [10] * ratio        ← Distance from top
       Logo is AUTO-CENTERED horizontally like the 3 images
    
    ================================================================================
    */
    
    // ⚙️ CARD GLOW INTENSITY CONTROL
    const CARD_GLOW_INTENSITY = 50;  // ← CHANGE: Glow size in pixels (30-100 recommended)
    const CARD_GLOW_OPACITY = 0.4;   // ← CHANGE: Glow opacity (0.0 to 1.0)
    
    const borderRadius = 20 * ratio;
    
    // Enhanced card background with blue-tinted gradient (BRIGHTER)
    const gradient = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
    gradient.addColorStop(0, '#15152a');      // Brighter dark blue
    gradient.addColorStop(0.5, '#1f1f32');    // Brighter blue-gray
    gradient.addColorStop(1, '#252538');      // Brighter lighter blue-gray
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    
    // Add subtle radial glow from center (STRONGER)
    const centerX = x + cardWidth / 2;
    const centerY = y + cardHeight / 2;
    const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cardWidth * 0.6);
    radialGradient.addColorStop(0, 'rgba(30, 50, 90, 0.4)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGradient;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    
    // Add subtle tech grid pattern overlay (LARGER SPACING)
    ctx.save();
    ctx.strokeStyle = 'rgba(40, 80, 120, 0.15)';
    ctx.lineWidth = 0.5 * ratio;
    const gridSize = 60 * ratio;  // ← LARGER GRID (was 30)
    
    // Vertical lines
    for (let i = x; i < x + cardWidth; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + cardHeight);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let j = y; j < y + cardHeight; j += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, j);
        ctx.lineTo(x + cardWidth, j);
        ctx.stroke();
    }
    ctx.restore();
    
    // Card border
    ctx.strokeStyle = '#2a3a50';
    ctx.lineWidth = 2 * ratio;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.stroke();
    
    // Glow effect with adjustable intensity
    ctx.shadowColor = `rgba(0, 255, 255, ${CARD_GLOW_OPACITY})`;
    ctx.shadowBlur = CARD_GLOW_INTENSITY * ratio;
    ctx.strokeStyle = '#2a3a50';
    ctx.lineWidth = 2 * ratio;
    roundRect(ctx, x, y, cardWidth, cardHeight, borderRadius);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Top neon line
    const topLineGradient = ctx.createLinearGradient(x, y, x + cardWidth, y);
    topLineGradient.addColorStop(0, 'transparent');
    topLineGradient.addColorStop(0.5, '#00ffff');
    topLineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = topLineGradient;
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y);
    ctx.lineTo(x + cardWidth - borderRadius, y);
    ctx.stroke();
    
    // Corner decorations
    drawCornerDecorations(ctx, x, y, cardWidth, cardHeight, ratio);
    
    // Main ship image area (left side) - 16:9 aspect ratio
    const mainImageWidth = 320 * ratio;
    const mainImageHeight = 180 * ratio;
    const mainImageX = x + 25 * ratio;
    const mainImageY = y + 25 * ratio;
    
    // Draw main image
    drawImageInArea(ctx, currentPhoto, mainImageX, mainImageY, mainImageWidth, mainImageHeight, imageScale, imageX, imageY, ratio, 'image');
    
    // ⚙️ ADJUSTMENT CONTROLS FOR BOTTOM 4 IMAGES:
    const bottomRowTopGap = 20 * ratio;        // ← CHANGE: Gap above bottom row
    const bottomRowBottomGap = 20 * ratio;     // ← CHANGE: Gap below bottom row
    const bottomLeftMargin = 60 * ratio;       // ← CHANGE: Left margin from border
    const bottomRightMargin = 60 * ratio;      // ← CHANGE: Right margin from border
    
    // Calculate where info grid will be
    const bottomImageSize = 50 * ratio;
    const infoGridY = mainImageY + mainImageHeight + bottomRowTopGap + bottomImageSize + bottomRowBottomGap;
    
    // Center bottom 4 images vertically in the space
    const bottomImageY = mainImageY + mainImageHeight + bottomRowTopGap;
    
    // Calculate bottom row positioning with margins
    const bottomStartX = x + bottomLeftMargin;
    const bottomEndX = x + cardWidth - bottomRightMargin;
    const totalBottomWidth = bottomEndX - bottomStartX;
    const totalBottomImagesWidth = bottomImageSize * 4;
    const bottomImageGap = (totalBottomWidth - totalBottomImagesWidth) / 3;
    
    // Photo 4
    drawImageInArea(ctx, additionalPhotos.photo4, bottomStartX, bottomImageY, bottomImageSize, bottomImageSize,
                    parseFloat(document.getElementById('image4Scale').value),
                    parseFloat(document.getElementById('image4XOffset').value) * ratio,
                    parseFloat(document.getElementById('image4YOffset').value) * ratio,
                    ratio, 'image4');
    
    // Photo 5
    const photo5X = bottomStartX + bottomImageSize + bottomImageGap;
    drawImageInArea(ctx, additionalPhotos.photo5, photo5X, bottomImageY, bottomImageSize, bottomImageSize,
                    parseFloat(document.getElementById('image5Scale').value),
                    parseFloat(document.getElementById('image5XOffset').value) * ratio,
                    parseFloat(document.getElementById('image5YOffset').value) * ratio,
                    ratio, 'image5');
    
    // Photo 6
    const photo6X = photo5X + bottomImageSize + bottomImageGap;
    drawImageInArea(ctx, additionalPhotos.photo6, photo6X, bottomImageY, bottomImageSize, bottomImageSize,
                    parseFloat(document.getElementById('image6Scale').value),
                    parseFloat(document.getElementById('image6XOffset').value) * ratio,
                    parseFloat(document.getElementById('image6YOffset').value) * ratio,
                    ratio, 'image6');
    
    // Photo 7
    const photo7X = photo6X + bottomImageSize + bottomImageGap;
    drawImageInArea(ctx, additionalPhotos.photo7, photo7X, bottomImageY, bottomImageSize, bottomImageSize,
                    parseFloat(document.getElementById('image7Scale').value),
                    parseFloat(document.getElementById('image7XOffset').value) * ratio,
                    parseFloat(document.getElementById('image7YOffset').value) * ratio,
                    ratio, 'image7');
    
    // ⚙️ RIGHT COLUMN - Logo and 3 images
    const rightColumnStartX = mainImageX + mainImageWidth + 10 * ratio;
    const rightColumnWidth = (x + cardWidth - 25 * ratio) - rightColumnStartX;
    
    // ⚙️ ADJUSTMENT CONTROLS FOR LOGO:
    const logoSize = 35 * ratio;               // ← User's preferred logo size
    const logoTopMargin = 40 * ratio;          // ← User's preferred distance from top
    
    // Logo positioning (centered in right column)
    const logoX = rightColumnStartX + (rightColumnWidth - logoSize) / 2;
    const logoY = y + logoTopMargin;
    
    // Draw logo directly without background box (just the image itself)
    if (logoImage) {
        ctx.save();
        
        const imgCenterX = logoX + logoSize / 2;
        const imgCenterY = logoY + logoSize / 2;
        
        ctx.translate(imgCenterX, imgCenterY);
        
        // Calculate dimensions to preserve aspect ratio
        const imgAspect = logoImage.width / logoImage.height;
        const areaAspect = 1; // Square area
        
        let drawWidth, drawHeight;
        if (imgAspect > areaAspect) {
            drawWidth = logoSize;
            drawHeight = logoSize / imgAspect;
        } else {
            drawHeight = logoSize;
            drawWidth = logoSize * imgAspect;
        }
        
        ctx.drawImage(logoImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        
        ctx.restore();
    }
    
    // ⚙️ ADJUSTMENT CONTROL FOR RIGHT 3 IMAGES POSITION:
    const rightGroupBottomMargin = 100 * ratio;  // ← CHANGE: Distance from info grid (higher = moves UP)
    
    // Photos 2 and 3 dimensions - USER PREFERRED SETTINGS
    const smallSquareSize = 40 * ratio;
    const smallGap = 20 * ratio;
    const bottomRightRowWidth = smallSquareSize + smallGap + smallSquareSize;
    
    // Calculate position from bottom (above info grid)
    const photo3Y = infoGridY - rightGroupBottomMargin - smallSquareSize;
    
    // Photo 1 above photos 2&3 - USER PREFERRED SETTINGS
    const photo1Size = 55 * ratio;
    const photo1Y = photo3Y - 10 * ratio - photo1Size;
    
    // Center the right group horizontally
    const rightGroupOffsetX = (rightColumnWidth - bottomRightRowWidth) / 2;
    const photo2StartX = rightColumnStartX + rightGroupOffsetX;
    
    // Photo 1 - centered above photos 2&3
    const photo1CenterOffset = (bottomRightRowWidth - photo1Size) / 2;
    const photo1X = photo2StartX + photo1CenterOffset;
    drawImageInArea(ctx, additionalPhotos.photo1, photo1X, photo1Y, photo1Size, photo1Size, 
                    parseFloat(document.getElementById('image1Scale').value),
                    parseFloat(document.getElementById('image1XOffset').value) * ratio,
                    parseFloat(document.getElementById('image1YOffset').value) * ratio,
                    ratio, 'image1');
    
    // Photo 2
    const photo2X = photo2StartX;
    const photo2Y = photo3Y;
    drawImageInArea(ctx, additionalPhotos.photo2, photo2X, photo2Y, smallSquareSize, smallSquareSize,
                    parseFloat(document.getElementById('image2Scale').value),
                    parseFloat(document.getElementById('image2XOffset').value) * ratio,
                    parseFloat(document.getElementById('image2YOffset').value) * ratio,
                    ratio, 'image2');
    
    // Photo 3
    const photo3X = photo2X + smallSquareSize + smallGap;
    drawImageInArea(ctx, additionalPhotos.photo3, photo3X, photo3Y, smallSquareSize, smallSquareSize,
                    parseFloat(document.getElementById('image3Scale').value),
                    parseFloat(document.getElementById('image3XOffset').value) * ratio,
                    parseFloat(document.getElementById('image3YOffset').value) * ratio,
                    ratio, 'image3');
    
    // Ship name overlay on main image
    const overlayGradient = ctx.createLinearGradient(mainImageX, mainImageY + mainImageHeight - 60 * ratio, mainImageX, mainImageY + mainImageHeight);
    overlayGradient.addColorStop(0, 'transparent');
    overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = overlayGradient;
    
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, mainImageX, mainImageY, mainImageWidth, mainImageHeight, 15 * ratio);
    ctx.clip();
    ctx.fillRect(mainImageX, mainImageY + mainImageHeight - 60 * ratio, mainImageWidth, 60 * ratio);
    ctx.restore();
    
    // Ship name text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${22 * ratio}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10 * ratio;
    const shipName = document.getElementById('shipName').value || ' ';
    ctx.fillText(shipName, mainImageX + mainImageWidth / 2, mainImageY + mainImageHeight - 20 * ratio);
    ctx.shadowBlur = 0;
    
    // Info grid (uses infoGridY calculated earlier)
    drawInfoGrid(ctx, x, infoGridY, cardWidth, ratio);
    
    // Status section
    const statusY = infoGridY + 80 * ratio;
    drawStatusSection(ctx, x, statusY, cardWidth, ratio);
    
    // Acquisition section
    const acquisitionY = statusY + 80 * ratio;
    drawAcquisitionSection(ctx, x, acquisitionY, cardWidth, ratio);
    
    // Footer text
    ctx.fillStyle = '#ffffff';
    ctx.font = `${15 * ratio}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 2 * ratio;
    ctx.fillText('@armada_legends', x + cardWidth / 2, y + cardHeight - 25 * ratio);
    ctx.shadowBlur = 0;

}


function drawImageInArea(ctx, image, areaX, areaY, areaWidth, areaHeight, scale, offsetX, offsetY, ratio, imageType) {
    // Area background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    roundRect(ctx, areaX, areaY, areaWidth, areaHeight, 15 * ratio);
    ctx.fill();
    
    // Area border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1 * ratio;
    roundRect(ctx, areaX, areaY, areaWidth, areaHeight, 15 * ratio);
    ctx.stroke();
    
    // Draw image if exists
    if (image) {
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, areaX, areaY, areaWidth, areaHeight, 15 * ratio);
        ctx.clip();
        
        const imgCenterX = areaX + areaWidth / 2;
        const imgCenterY = areaY + areaHeight / 2;
        
        ctx.translate(imgCenterX + offsetX, imgCenterY + offsetY);
        ctx.scale(scale, scale);
        
        // Calculate dimensions to preserve aspect ratio
        const imgAspect = image.width / image.height;
        const areaAspect = areaWidth / areaHeight;
        
        let drawWidth, drawHeight;
        if (imgAspect > areaAspect) {
            // Image is wider - fit to width
            drawWidth = areaWidth;
            drawHeight = areaWidth / imgAspect;
        } else {
            // Image is taller - fit to height
            drawHeight = areaHeight;
            drawWidth = areaHeight * imgAspect;
        }
        
        ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        
        ctx.restore();
    }
}

function drawInfoGrid(ctx, x, y, cardWidth, ratio) {
    const items = [
        { label: 'Нация', value: document.getElementById('nationSelect').value },
        { label: 'Уровень', value: document.getElementById('levelSelect').value },
        { label: 'Класс', value: document.getElementById('classSelect').value }
    ];
    
    const itemWidth = (cardWidth - 50 * ratio - 20 * ratio) / 3;
    const itemHeight = 60 * ratio;
    const gap = 10 * ratio;
    const startX = x + 25 * ratio;
    
    // Draw info items
    items.forEach((item, index) => {
        const itemX = startX + index * (itemWidth + gap);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(ctx, itemX, y, itemWidth, itemHeight, 8 * ratio);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * ratio;
        roundRect(ctx, itemX, y, itemWidth, itemHeight, 8 * ratio);
        ctx.stroke();
        
        // Left accent line gradient
        const accentGradient = ctx.createLinearGradient(itemX, y, itemX, y + itemHeight);
        accentGradient.addColorStop(0, '#00ffff');
        accentGradient.addColorStop(1, '#ff0080');
        ctx.fillStyle = accentGradient;
        ctx.fillRect(itemX, y, 3 * ratio, itemHeight);
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${11 * ratio}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(item.label.toUpperCase(), itemX + 10 * ratio, y + 20 * ratio);
        
        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14 * ratio}px Arial`;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.shadowBlur = 5 * ratio;
        ctx.fillText(item.value, itemX + 10 * ratio, y + 45 * ratio);
        ctx.shadowBlur = 0;
    });
}

function drawInfoGridWithImages(ctx, x, y, cardWidth, ratio) {
    const items = [
        { label: 'Нация', value: document.getElementById('nationSelect').value },
        { label: 'Уровень', value: document.getElementById('levelSelect').value },
        { label: 'Класс', value: document.getElementById('classSelect').value }
    ];
    
    const itemWidth = (cardWidth - 50 * ratio - 20 * ratio) / 3;
    const itemHeight = 60 * ratio;
    const gap = 10 * ratio;
    const startX = x + 25 * ratio;
    
    // Draw info items
    items.forEach((item, index) => {
        const itemX = startX + index * (itemWidth + gap);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(ctx, itemX, y, itemWidth, itemHeight, 8 * ratio);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * ratio;
        roundRect(ctx, itemX, y, itemWidth, itemHeight, 8 * ratio);
        ctx.stroke();
        
        // Left accent line gradient
        const accentGradient = ctx.createLinearGradient(itemX, y, itemX, y + itemHeight);
        accentGradient.addColorStop(0, '#00ffff');
        accentGradient.addColorStop(1, '#ff0080');
        ctx.fillStyle = accentGradient;
        ctx.fillRect(itemX, y, 3 * ratio, itemHeight);
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${11 * ratio}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(item.label.toUpperCase(), itemX + 10 * ratio, y + 20 * ratio);
        
        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14 * ratio}px Arial`;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.shadowBlur = 5 * ratio;
        ctx.fillText(item.value, itemX + 10 * ratio, y + 45 * ratio);
        ctx.shadowBlur = 0;
    });
    
    // Draw 4 bottom images
    const imageY = y + itemHeight + 10 * ratio;
    const imageSize = (cardWidth - 50 * ratio - 30 * ratio) / 4; // 4 images with gaps
    const imageGap = 10 * ratio;
    
    // Photo 4
    const photo4X = startX;
    drawImageInArea(ctx, additionalPhotos.photo4, photo4X, imageY, imageSize, imageSize,
                    parseFloat(document.getElementById('image4Scale').value),
                    parseFloat(document.getElementById('image4XOffset').value) * ratio,
                    parseFloat(document.getElementById('image4YOffset').value) * ratio,
                    ratio, 'image4');
    
    // Photo 5
    const photo5X = photo4X + imageSize + imageGap;
    drawImageInArea(ctx, additionalPhotos.photo5, photo5X, imageY, imageSize, imageSize,
                    parseFloat(document.getElementById('image5Scale').value),
                    parseFloat(document.getElementById('image5XOffset').value) * ratio,
                    parseFloat(document.getElementById('image5YOffset').value) * ratio,
                    ratio, 'image5');
    
    // Photo 6
    const photo6X = photo5X + imageSize + imageGap;
    drawImageInArea(ctx, additionalPhotos.photo6, photo6X, imageY, imageSize, imageSize,
                    parseFloat(document.getElementById('image6Scale').value),
                    parseFloat(document.getElementById('image6XOffset').value) * ratio,
                    parseFloat(document.getElementById('image6YOffset').value) * ratio,
                    ratio, 'image6');
    
    // Photo 7
    const photo7X = photo6X + imageSize + imageGap;
    drawImageInArea(ctx, additionalPhotos.photo7, photo7X, imageY, imageSize, imageSize,
                    parseFloat(document.getElementById('image7Scale').value),
                    parseFloat(document.getElementById('image7XOffset').value) * ratio,
                    parseFloat(document.getElementById('image7YOffset').value) * ratio,
                    ratio, 'image7');
}

function drawStatusSection(ctx, x, y, cardWidth, ratio) {
    const startX = x + 25 * ratio;
    const width = cardWidth - 50 * ratio;
    const height = 60 * ratio;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    roundRect(ctx, startX, y, width, height, 10 * ratio);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1 * ratio;
    roundRect(ctx, startX, y, width, height, 10 * ratio);
    ctx.stroke();
    
    // Top accent line
    const accentGradient = ctx.createLinearGradient(startX, y, startX + width, y);
    accentGradient.addColorStop(0, '#ffd700');
    accentGradient.addColorStop(1, '#ff8c00');
    ctx.strokeStyle = accentGradient;
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.moveTo(startX + 10 * ratio, y);
    ctx.lineTo(startX + width - 10 * ratio, y);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.font = `${11 * ratio}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('СТАТУС', startX + 12 * ratio, y + 20 * ratio);
    
    // Value
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${16 * ratio}px Arial`;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 8 * ratio;
    const status = document.getElementById('statusSelect').value;
    ctx.fillText(status, startX + 12 * ratio, y + 45 * ratio);
    ctx.shadowBlur = 0;
}

function drawAcquisitionSection(ctx, x, y, cardWidth, ratio) {
    const startX = x + 25 * ratio;
    const width = cardWidth - 50 * ratio;
    const height = 60 * ratio;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    roundRect(ctx, startX, y, width, height, 8 * ratio);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1 * ratio;
    roundRect(ctx, startX, y, width, height, 8 * ratio);
    ctx.stroke();
    
    // Top accent line
    const accentGradient = ctx.createLinearGradient(startX, y, startX + width, y);
    accentGradient.addColorStop(0, '#00ff00');
    accentGradient.addColorStop(1, '#00ffff');
    ctx.strokeStyle = accentGradient;
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.moveTo(startX + 8 * ratio, y);
    ctx.lineTo(startX + width - 8 * ratio, y);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = `${11 * ratio}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('ВАРИАНТЫ ПОЛУЧЕНИЯ', startX + 12 * ratio, y + 20 * ratio);
    
    // Value
    const selectedOptions = getSelectedObtainingOptions();
    const acquisitionText = selectedOptions.length > 0 ? selectedOptions.join(' • ') : 'Нет данных';
    
    ctx.fillStyle = '#00ff88';
    ctx.font = `bold ${14 * ratio}px Arial`;
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 5 * ratio;
    ctx.fillText(acquisitionText, startX + 12 * ratio, y + 45 * ratio);
    ctx.shadowBlur = 0;
}

function drawCornerDecorations(ctx, x, y, width, height, ratio) {
    const size = 50 * ratio;
    const offset = 15 * ratio;
    const cornerRadius = 15 * ratio;
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2 * ratio;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x + offset + size, y + offset);
    ctx.lineTo(x + offset + cornerRadius, y + offset);
    ctx.arcTo(x + offset, y + offset, x + offset, y + offset + cornerRadius, cornerRadius);
    ctx.lineTo(x + offset, y + offset + size);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + width - offset - size, y + offset);
    ctx.lineTo(x + width - offset - cornerRadius, y + offset);
    ctx.arcTo(x + width - offset, y + offset, x + width - offset, y + offset + cornerRadius, cornerRadius);
    ctx.lineTo(x + width - offset, y + offset + size);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x + offset, y + height - offset - size);
    ctx.lineTo(x + offset, y + height - offset - cornerRadius);
    ctx.arcTo(x + offset, y + height - offset, x + offset + cornerRadius, y + height - offset, cornerRadius);
    ctx.lineTo(x + offset + size, y + height - offset);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + width - offset, y + height - offset - size);
    ctx.lineTo(x + width - offset, y + height - offset - cornerRadius);
    ctx.arcTo(x + width - offset, y + height - offset, x + width - offset - cornerRadius, y + height - offset, cornerRadius);
    ctx.lineTo(x + width - offset - size, y + height - offset);
    ctx.stroke();
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

function getSelectedObtainingOptions() {
    const selected = [];
    OBTAINING_OPTIONS.forEach(option => {
        const checkbox = document.getElementById(`opt_${option}`);
        if (checkbox && checkbox.checked) {
            selected.push(option);
        }
    });
    return selected;
}

function generateFinalImage() {
    if (!currentPhoto) {
        alert('Пожалуйста, загрузите фото корабля.');
        return;
    }
    
    const btn = document.getElementById('generateBtn');
    const progressBar = document.getElementById('progressBar');
    
    // Show progress
    btn.disabled = true;
    btn.textContent = 'Генерация...';
    progressBar.style.display = 'block';
    
    setTimeout(() => {
        try {
            const resolution = document.getElementById('outputSize').value;
            const [width, height] = OUTPUT_SIZES[resolution];
            
            // Create offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Render final image
            renderCard(ctx, width, height, true);
            
            // Download - NO ALERT, just save
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const shipName = document.getElementById('shipName').value.trim().replace(/\s+/g, '_') || 'card';
                a.download = `${shipName}_${resolution}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Hide progress - NO ALERT
                btn.disabled = false;
                btn.textContent = 'Сгенерировать финальное изображение';
                progressBar.style.display = 'none';
            });
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Ошибка при генерации изображения: ' + error.message);
            
            btn.disabled = false;
            btn.textContent = 'Сгенерировать финальное изображение';
            progressBar.style.display = 'none';
        }
    }, 100);
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all buttons and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function handleResolutionChange() {
    saveSettings();
    loadSlidersForResolution();
    triggerPreviewUpdate();
}

function handleTemplateChange() {
    currentTemplateType = document.getElementById('templateType').value;
    saveSettings();
    updatePreview();
}

function loadSlidersForResolution() {
    const resolution = document.getElementById('outputSize').value;
    const transforms = settings.transforms[resolution] || {
        card: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image1: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image2: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image3: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image4: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image5: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image6: { scale: 1.0, x_offset: 0, y_offset: 0 },
        image7: { scale: 1.0, x_offset: 0, y_offset: 0 }
    };
    
    // Card transforms
    document.getElementById('cardScale').value = transforms.card.scale;
    document.getElementById('cardXOffset').value = transforms.card.x_offset;
    document.getElementById('cardYOffset').value = transforms.card.y_offset;
    
    // Main image transforms
    document.getElementById('imageScale').value = transforms.image.scale;
    document.getElementById('imageXOffset').value = transforms.image.x_offset;
    document.getElementById('imageYOffset').value = transforms.image.y_offset;
    
    // Additional images transforms
    for (let i = 1; i <= 7; i++) {
        const key = `image${i}`;
        document.getElementById(`${key}Scale`).value = transforms[key]?.scale || 1.0;
        document.getElementById(`${key}XOffset`).value = transforms[key]?.x_offset || 0;
        document.getElementById(`${key}YOffset`).value = transforms[key]?.y_offset || 0;
    }
    
    // Update all slider displays
    updateSliderValue('cardScale');
    updateSliderValue('cardXOffset');
    updateSliderValue('cardYOffset');
    updateSliderValue('imageScale');
    updateSliderValue('imageXOffset');
    updateSliderValue('imageYOffset');
    for (let i = 1; i <= 7; i++) {
        updateSliderValue(`image${i}Scale`);
        updateSliderValue(`image${i}XOffset`);
        updateSliderValue(`image${i}YOffset`);
    }
}

function resetCardSettings() {
    document.getElementById('cardScale').value = 1.0;
    document.getElementById('cardXOffset').value = 0;
    document.getElementById('cardYOffset').value = 0;
    updateSliderValue('cardScale');
    updateSliderValue('cardXOffset');
    updateSliderValue('cardYOffset');
    triggerPreviewUpdate();
}

function resetImageSettings() {
    document.getElementById('imageScale').value = 1.0;
    document.getElementById('imageXOffset').value = 0;
    document.getElementById('imageYOffset').value = 0;
    updateSliderValue('imageScale');
    updateSliderValue('imageXOffset');
    updateSliderValue('imageYOffset');
    triggerPreviewUpdate();
}

function resetImage1Settings() {
    document.getElementById('image1Scale').value = 1.0;
    document.getElementById('image1XOffset').value = 0;
    document.getElementById('image1YOffset').value = 0;
    updateSliderValue('image1Scale');
    updateSliderValue('image1XOffset');
    updateSliderValue('image1YOffset');
    triggerPreviewUpdate();
}

function resetImage2Settings() {
    document.getElementById('image2Scale').value = 1.0;
    document.getElementById('image2XOffset').value = 0;
    document.getElementById('image2YOffset').value = 0;
    updateSliderValue('image2Scale');
    updateSliderValue('image2XOffset');
    updateSliderValue('image2YOffset');
    triggerPreviewUpdate();
}

function resetImage3Settings() {
    document.getElementById('image3Scale').value = 1.0;
    document.getElementById('image3XOffset').value = 0;
    document.getElementById('image3YOffset').value = 0;
    updateSliderValue('image3Scale');
    updateSliderValue('image3XOffset');
    updateSliderValue('image3YOffset');
    triggerPreviewUpdate();
}

function resetImage4Settings() {
    document.getElementById('image4Scale').value = 1.0;
    document.getElementById('image4XOffset').value = 0;
    document.getElementById('image4YOffset').value = 0;
    updateSliderValue('image4Scale');
    updateSliderValue('image4XOffset');
    updateSliderValue('image4YOffset');
    triggerPreviewUpdate();
}

function resetImage5Settings() {
    document.getElementById('image5Scale').value = 1.0;
    document.getElementById('image5XOffset').value = 0;
    document.getElementById('image5YOffset').value = 0;
    updateSliderValue('image5Scale');
    updateSliderValue('image5XOffset');
    updateSliderValue('image5YOffset');
    triggerPreviewUpdate();
}

function resetImage6Settings() {
    document.getElementById('image6Scale').value = 1.0;
    document.getElementById('image6XOffset').value = 0;
    document.getElementById('image6YOffset').value = 0;
    updateSliderValue('image6Scale');
    updateSliderValue('image6XOffset');
    updateSliderValue('image6YOffset');
    triggerPreviewUpdate();
}

function resetImage7Settings() {
    document.getElementById('image7Scale').value = 1.0;
    document.getElementById('image7XOffset').value = 0;
    document.getElementById('image7YOffset').value = 0;
    updateSliderValue('image7Scale');
    updateSliderValue('image7XOffset');
    updateSliderValue('image7YOffset');
    triggerPreviewUpdate();
}

// Settings management
function saveSettings() {
    const resolution = document.getElementById('outputSize').value;
    
    if (!settings.transforms[resolution]) {
        settings.transforms[resolution] = {};
    }
    
    settings.transforms[resolution].card = {
        scale: parseFloat(document.getElementById('cardScale').value),
        x_offset: parseFloat(document.getElementById('cardXOffset').value),
        y_offset: parseFloat(document.getElementById('cardYOffset').value)
    };
    
    settings.transforms[resolution].image = {
        scale: parseFloat(document.getElementById('imageScale').value),
        x_offset: parseFloat(document.getElementById('imageXOffset').value),
        y_offset: parseFloat(document.getElementById('imageYOffset').value)
    };
    
    // Save all additional images transforms
    for (let i = 1; i <= 7; i++) {
        const key = `image${i}`;
        settings.transforms[resolution][key] = {
            scale: parseFloat(document.getElementById(`${key}Scale`).value),
            x_offset: parseFloat(document.getElementById(`${key}XOffset`).value),
            y_offset: parseFloat(document.getElementById(`${key}YOffset`).value)
        };
    }
    
    settings.ship_name = document.getElementById('shipName').value;
    settings.nation = document.getElementById('nationSelect').value;
    settings.level = document.getElementById('levelSelect').value;
    settings.class = document.getElementById('classSelect').value;
    settings.status = document.getElementById('statusSelect').value;
    settings.output_size = resolution;
    settings.template_type = document.getElementById('templateType').value;
    
    settings.obtaining_options = {};
    OBTAINING_OPTIONS.forEach(option => {
        const checkbox = document.getElementById(`opt_${option}`);
        settings.obtaining_options[option] = checkbox.checked ? 'on' : 'off';
    });
    
    localStorage.setItem('shipCardSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('shipCardSettings');
    if (saved) {
        try {
            settings = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
    
    // Apply saved settings
    document.getElementById('shipName').value = settings.ship_name || '';
    document.getElementById('outputSize').value = settings.output_size || '1600x1600';
    document.getElementById('templateType').value = settings.template_type || 'new';
    currentTemplateType = settings.template_type || 'new';
    
    if (settings.nation) document.getElementById('nationSelect').value = settings.nation;
    if (settings.level) document.getElementById('levelSelect').value = settings.level;
    if (settings.class) document.getElementById('classSelect').value = settings.class;
    if (settings.status) document.getElementById('statusSelect').value = settings.status;
    
    // Load obtaining options
    if (settings.obtaining_options) {
        Object.entries(settings.obtaining_options).forEach(([option, value]) => {
            const checkbox = document.getElementById(`opt_${option}`);
            if (checkbox) {
                checkbox.checked = value === 'on';
            }
        });
    }
    
    // Update option menus with custom options
    updateAllOptionMenus();
    
    // Load slider values for current resolution
    loadSlidersForResolution();
}

// Option manager
function openOptionManager(label, type) {
    currentModalType = type;
    document.getElementById('modalTitle').textContent = `Управление: ${label}`;
    
    const modal = document.getElementById('optionModal');
    modal.classList.add('active');
    
    updateOptionsList();
}

function closeOptionManager() {
    document.getElementById('optionModal').classList.remove('active');
    currentModalType = null;
    document.getElementById('newOptionInput').value = '';
}

function updateOptionsList() {
    const listContainer = document.getElementById('optionsList');
    listContainer.innerHTML = '';
    
    const customOptions = settings.custom_options[currentModalType] || [];
    
    customOptions.forEach(option => {
        const div = document.createElement('div');
        div.className = 'option-list-item';
        
        const span = document.createElement('span');
        span.textContent = option;
        
        const btn = document.createElement('button');
        btn.textContent = 'Удалить';
        btn.onclick = () => deleteOption(option);
        
        div.appendChild(span);
        div.appendChild(btn);
        listContainer.appendChild(div);
    });
}

function addNewOption() {
    const input = document.getElementById('newOptionInput');
    const value = input.value.trim();
    
    if (!value) {
        alert('Введите значение');
        return;
    }
    
    if (!settings.custom_options[currentModalType]) {
        settings.custom_options[currentModalType] = [];
    }
    
    if (settings.custom_options[currentModalType].includes(value)) {
        alert('Это значение уже существует');
        return;
    }
    
    settings.custom_options[currentModalType].push(value);
    saveSettings();
    updateAllOptionMenus();
    updateOptionsList();
    input.value = '';
}

function deleteOption(value) {
    if (confirm(`Удалить "${value}"?`)) {
        const index = settings.custom_options[currentModalType].indexOf(value);
        if (index > -1) {
            settings.custom_options[currentModalType].splice(index, 1);
            saveSettings();
            updateAllOptionMenus();
            updateOptionsList();
        }
    }
}

function updateAllOptionMenus() {
    populateSelect('nationSelect', NATIONS, settings.custom_options.NATIONS || []);
    populateSelect('levelSelect', LEVELS, settings.custom_options.LEVELS || []);
    populateSelect('classSelect', CLASSES, settings.custom_options.CLASSES || []);
    populateSelect('statusSelect', STATUSES, settings.custom_options.STATUSES || []);
    
    // Restore selected values
    if (settings.nation) document.getElementById('nationSelect').value = settings.nation;
    if (settings.level) document.getElementById('levelSelect').value = settings.level;
    if (settings.class) document.getElementById('classSelect').value = settings.class;
    if (settings.status) document.getElementById('statusSelect').value = settings.status;
}

// Auto-save on window unload
window.addEventListener('beforeunload', saveSettings);