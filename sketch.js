let mainFace;
let memories = [];
let cycleStartTime;
let activeMemories = [];
let isLoading = true;
let loadedImages = 0;
let totalImages = 11;
let faceWidth, faceHeight;
let currentMemoryIndex = 0;
let lastMemoryTime = 0;
let faceDisplayTime = 0;
let isShowingFace = true;
let mouseCircleAlpha = 0;
let targetFrameRate = 60;

class Memory {
    constructor(x, y, img) {
        this.x = x;
        this.y = y;
        this.img = img;
        this.alpha = 255;
        this.birth = millis();
        this.fadeStartTime = 0;
        this.displayDuration = 2000;
        this.fadeDuration = 1000;
    }

    display() {
        if (this.img) {
            push();
            tint(255, this.alpha);
            image(this.img, this.x, this.y, faceWidth, faceHeight);
            pop();
        }
    }

    update() {
        const currentTime = millis();
        const timeSinceBirth = currentTime - this.birth;
        const fadeSpeed = targetFrameRate / frameRate();
        
        if (timeSinceBirth > this.displayDuration) {
            if (this.fadeStartTime === 0) {
                this.fadeStartTime = currentTime;
            }
            
            const fadeProgress = (currentTime - this.fadeStartTime) / this.fadeDuration;
            this.alpha = max(0, 255 * (1 - fadeProgress));
            
            if (this.alpha <= 0) {
                return true;
            }
        }
        return false;
    }
}

function calculateImageSize() {
    const screenRatio = width / height;
    const imageRatio = mainFace.width / mainFace.height;
    
    const maxWidth = width * 0.85;
    const maxHeight = height * 0.85;
    
    if (screenRatio > imageRatio) {
        faceHeight = maxHeight;
        faceWidth = faceHeight * imageRatio;
        
        if (faceWidth > maxWidth) {
            faceWidth = maxWidth;
            faceHeight = faceWidth / imageRatio;
        }
    } else {
        faceWidth = maxWidth;
        faceHeight = faceWidth / imageRatio;
        
        if (faceHeight > maxHeight) {
            faceHeight = maxHeight;
            faceWidth = faceHeight * imageRatio;
        }
    }
}

function drawMouseCircle() {
    push();
    noStroke();
    for (let i = 0; i < 30; i++) {
        let alpha = map(i, 0, 30, mouseCircleAlpha, 0);
        fill(255, alpha);
        let size = map(i, 0, 30, 0, 300);
        circle(mouseX, mouseY, size);
    }
    pop();
}

function imageLoaded() {
    loadedImages++;
    if (loadedImages === totalImages) {
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
    }
}

function preload() {
    document.getElementById('loading').style.display = 'block';
    
    loadImage('face.png', 
        img => {
            mainFace = img;
            imageLoaded();
        },
        () => handleLoadError('face.png')
    );
    
    for (let i = 1; i <= 10; i++) {
        loadImage(`memory${i}.png`, 
            img => {
                memories[i-1] = img;
                imageLoaded();
            },
            () => handleLoadError(`memory${i}.png`)
        );
    }
}

function handleLoadError(filename) {
    console.error(`Failed to load: ${filename}`);
    document.getElementById('loading').innerHTML = 
        `加载失败: ${filename}<br>请检查文件后刷新页面`;
}

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    cycleStartTime = millis();
    faceDisplayTime = millis();
    activeMemories = [];
    imageMode(CENTER);
    frameRate(targetFrameRate);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function resetCycle() {
    cycleStartTime = millis();
    activeMemories = [];
    currentMemoryIndex = 0;
    lastMemoryTime = 0;
    faceDisplayTime = millis();
    isShowingFace = true;
}

function createNewMemory() {
    if (currentMemoryIndex < memories.length) {
        activeMemories.push(new Memory(width/2, height/2, memories[currentMemoryIndex]));
        currentMemoryIndex++;
    }
}

function updateMemories() {
    for (let i = activeMemories.length - 1; i >= 0; i--) {
        const shouldRemove = activeMemories[i].update();
        activeMemories[i].display();
        if (shouldRemove) {
            activeMemories.splice(i, 1);
        }
    }
}

function draw() {
    if (isLoading) return;
    
    background(0);
    
    const fadeSpeed = 1.0;
    if (mouseX > 0 && mouseY > 0) {
        mouseCircleAlpha = lerp(mouseCircleAlpha, 255, 0.15 * fadeSpeed);
    } else {
        mouseCircleAlpha = lerp(mouseCircleAlpha, 0, 0.15 * fadeSpeed);
    }
    
    drawMouseCircle();
    
    calculateImageSize();
    
    image(mainFace, width/2, height/2, faceWidth, faceHeight);
    
    let currentTime = millis();
    
    if (currentTime - cycleStartTime > 35000 || 
        (currentMemoryIndex >= memories.length && activeMemories.length === 0)) {
        resetCycle();
    }

    if (currentMemoryIndex < memories.length && 
        currentTime - lastMemoryTime >= 3000 && 
        currentTime - cycleStartTime <= 35000) {
        
        let hasActiveMemory = activeMemories.some(memory => memory.alpha > 50);
        
        if (!hasActiveMemory) {
            if (isShowingFace) {
                if (currentTime - faceDisplayTime >= 1500) {
                    isShowingFace = false;
                    createNewMemory();
                    lastMemoryTime = currentTime;
                    faceDisplayTime = currentTime;
                }
            } else {
                createNewMemory();
                lastMemoryTime = currentTime;
                faceDisplayTime = currentTime;
                isShowingFace = true;
            }
        }
    }

    updateMemories();
}