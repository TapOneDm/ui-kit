const GalleryClassName = 'gallery';
const GalleryLineContainerClassName = 'gallery-line-container';
const GalleryLineClassName = 'gallery-line';
const GallerySlideClassName = 'gallery-slide';
const GalleryDraggableClassName = 'gallery-draggable';
const GalleryDotsClassName = 'gallery-dots';
const GalleryDotClassName = 'gallery-dot';
const GalleryDotActiveClassName = 'gallery-dot-active';
const GalleryNavClassName = 'gallery-nav';
const GalleryNavLeftClassName = 'gallery-nav-left';
const GalleryNavRightClassName = 'gallery-nav-right';
const GalleryNavDisabledClassName = 'gallery-nav-disabled';

class Gallery {
    constructor(element, options = {}) {
        this.containerNode = element;
        this.size = element.childElementCount;
        this.currentSlideIndex = 0;
        this.currentSlideWasChanged = false;
        this.settings = {
            margin: options.margin || 0,
        };

        this.manageHTML = this.manageHTML.bind(this);
        this.setParams = this.setParams.bind(this);
        this.setEvents = this.setEvents.bind(this);
        this.resizeGallery = this.resizeGallery.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.dragging = this.dragging.bind(this);
        this.setStylePosition = this.setStylePosition.bind(this);
        this.clickDots = this.clickDots.bind(this);
        this.moveLeft = this.moveLeft.bind(this);
        this.moveRight = this.moveRight.bind(this);
        this.changeActiveDotClass = this.changeActiveDotClass.bind(this);
        this.changeDisabledNav = this.changeDisabledNav.bind(this);

        this.manageHTML();
        this.setParams();
        this.setEvents();
    }

    manageHTML() {
        this.containerNode.classList.add(GalleryClassName);
        this.containerNode.innerHTML = `
            <div class="${GalleryLineContainerClassName}">
                <div class="${GalleryLineClassName}">
                    ${this.containerNode.innerHTML}
                </div>
                <div class="${GalleryNavClassName}">
                    <button class="${GalleryNavLeftClassName}"></button>
                    <button class="${GalleryNavRightClassName}"></button>
                </div>
                <div class="${GalleryDotsClassName}"></div>
            </div>
        `;

        this.lineContainerNode = this.containerNode.querySelector(`.${GalleryLineContainerClassName}`);
        this.lineNode = this.containerNode.querySelector(`.${GalleryLineClassName}`);
        this.dotsNode = this.containerNode.querySelector(`.${GalleryDotsClassName}`);

        this.slideNodes = Array.from(this.lineNode.children).map((childNode) => wrapElementByDiv({ element: childNode, className: GallerySlideClassName }));

        this.dotsNode.innerHTML = Array.from(Array(this.size).keys())
            .map((key) => `<button class="${GalleryDotClassName} ${key === this.currentSlideIndex ? GalleryDotActiveClassName : ''}" ></button>`)
            .join('');

        this.dotNodes = this.dotsNode.querySelectorAll(`.${GalleryDotClassName}`);
        this.navLeft = this.containerNode.querySelector(`.${GalleryNavLeftClassName}`);
        this.navRight = this.containerNode.querySelector(`.${GalleryNavRightClassName}`);
    }

    setParams() {
        const coordsLineContainer = this.lineContainerNode.getBoundingClientRect();
        this.width = coordsLineContainer.width;
        this.maximumX = -(this.size - 1) * (this.width + this.settings.margin);
        this.x = -this.currentSlideIndex * (this.width + this.settings.margin);

        this.resetStyleTransition();
        this.lineNode.style.width = `${this.size * (this.width + this.settings.margin)}px`;
        this.setStylePosition();
        this.changeActiveDotClass();
        this.changeDisabledNav();

        Array.from(this.slideNodes).forEach((slideNode) => {
            slideNode.style.width = `${this.width}px`;
            slideNode.style.marginRight = `${this.settings.margin}px`;
        });
    }

    setEvents() {
        this.debounceResizeGallery = debounce(this.resizeGallery);
        window.addEventListener('resize', this.debounceResizeGallery);
        this.lineNode.addEventListener('pointerdown', this.startDrag);
        this.lineNode.addEventListener('pointerup', this.stopDrag);
        this.lineNode.addEventListener('pointercancel', this.stopDrag);

        this.dotsNode.addEventListener('click', this.clickDots);
        this.navLeft.addEventListener('click', this.moveLeft);
        this.navRight.addEventListener('click', this.moveRight);
    }

    destroyEvents() {
        window.removeEventListener('resize', this.debounceResizeGallery);
        window.removeEventListener('pointerdown', this.startDrag);
        window.removeEventListener('pointerup', this.stopDrag);
        window.removeEventListener('pointercancel', this.stopDrag);

        this.dotsNode.removeEventListener('click', this.clickDots);
        this.navLeft.removeEventListener('click', this.moveLeft);
        this.navRight.removeEventListener('click', this.moveRight);
    }

    resizeGallery() {
        this.setParams();
    }

    startDrag(e) {
        this.currentSlideWasChanged = false;
        this.currentSlideIndex;

        this.clickX = e.pageX;
        this.startX = this.x;
        this.resetStyleTransition();

        this.containerNode.classList.add(`${GalleryDraggableClassName}`);
        window.addEventListener('pointermove', this.dragging);
    }

    stopDrag() {
        window.removeEventListener('pointermove', this.dragging);
        this.containerNode.classList.remove(`${GalleryDraggableClassName}`);
        this.changeCurrentSlide();
    }

    dragging(e) {
        this.dragX = e.pageX;
        const dragShift = this.dragX - this.clickX;
        const easing = dragShift / 5;
        this.x = Math.max(Math.min(this.startX + dragShift, easing), this.maximumX + easing);
        this.setStylePosition();

        // Change active slide
        if (dragShift > 20 && dragShift > 0 && !this.currentSlideWasChanged && this.currentSlideIndex > 0) {
            this.currentSlideWasChanged = true;
            this.currentSlideIndex = this.currentSlideIndex - 1;
        }

        if (dragShift < -20 && dragShift < 0 && !this.currentSlideWasChanged && this.currentSlideIndex < this.size - 1) {
            this.currentSlideWasChanged = true;
            this.currentSlideIndex = this.currentSlideIndex + 1;
        }
    }

    clickDots(e) {
        const dotNode = e.target.closest('button');
        if (!dotNode) {
            return;
        }

        let dotNumber;
        for (let i = 0; i < this.dotNodes.length; i++) {
            if (this.dotNodes[i] === dotNode) {
                dotNumber = i;
                break;
            }
        }

        if (this.currentSlideIndex === dotNumber) {
            return;
        }

        const countSwipes = Math.abs(this.currentSlideIndex - dotNumber);
        this.currentSlideIndex = dotNumber;
        this.changeCurrentSlide(countSwipes);
    }

    moveLeft() {
        if (this.currentSlideIndex <= 0) {
            return;
        }

        this.currentSlideIndex = this.currentSlideIndex - 1;
        this.changeCurrentSlide();
    }

    moveRight() {
        if (this.currentSlideIndex >= this.size - 1) {
            return;
        }

        this.currentSlideIndex = this.currentSlideIndex + 1;
        this.changeCurrentSlide();
    }

    changeCurrentSlide(countSwipes) {
        this.x = -this.currentSlideIndex * (this.width + this.settings.margin);
        this.setStylePosition();
        this.setStyleTransition(countSwipes);
        this.changeActiveDotClass();
        this.changeDisabledNav();
    }

    changeActiveDotClass() {
        for (let i = 0; i < this.dotNodes.length; i++) {
            this.dotNodes[i].classList.remove(`${GalleryDotActiveClassName}`);
        }

        this.dotNodes[this.currentSlideIndex].classList.add(`${GalleryDotActiveClassName}`);
    }

    changeDisabledNav() {
        if (this.currentSlideIndex <= 0) {
            this.navLeft.classList.add(`${GalleryNavDisabledClassName}`)
        } else {
            this.navLeft.classList.remove(`${GalleryNavDisabledClassName}`)
        }

        if (this.currentSlideIndex >= this.size - 1) {
            this.navRight.classList.add(`${GalleryNavDisabledClassName}`)
        } else {
            this.navRight.classList.remove(`${GalleryNavDisabledClassName}`)
        }
    }
    setStylePosition() {
        this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
    }

    setStyleTransition(countSwipes = 1) {
        this.lineNode.style.transition = `all ${0.25 * countSwipes}s ease 0s`;
    }

    resetStyleTransition() {
        this.lineNode.style.transition = `all 0s ease 0s`;
    }
}

function wrapElementByDiv({ element, className }) {
    const wrapperNode = document.createElement('div');
    wrapperNode.classList.add(className);

    element.parentNode.insertBefore(wrapperNode, element);
    wrapperNode.appendChild(element);
    return wrapperNode;
}

function debounce(callback, time = 100) {
    let timer;
    return function (event) {
        clearTimeout(timer);
        timer = setTimeout(callback, time, event);
    };
}
