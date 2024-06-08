const draggableBlocks = document.querySelectorAll('.block-timeline--horizontal, .block-posts--carousel');

class DraggableBlock {
    constructor (block) {
        this.block = block;
        this.content = this.block.querySelector('.draggable-container');
        this.list = this.block.querySelector('ol, ul');
        this.items = this.list.querySelectorAll('.draggable-item');
        this.previous = this.block.querySelector('.previous');
        this.next = this.block.querySelector('.next');
        this.isPointerDown = false;

        this.index = 0;

        this.listen();
        this.resize();
        this.goTo(0);
    }

    listen () {
        window.addEventListener('resize', this.resize.bind(this));

        this.items.forEach((item, i) => {
            item.addEventListener('click', this.onClickItem.bind(this, i));
        });

        if (this.previous && this.next) {
            this.handleArrows();
        }

        this.handlePointers();
        this.handleScroll();
    }

    resize () {
        let maxTitleHeight = 0;

        this.block.style = '';

        this.itemWidth = this.items[0].offsetWidth;

        this.items.forEach((item) => {
            maxTitleHeight = Math.max(item.querySelector('.title, [itemprop="headline"]').offsetHeight, maxTitleHeight);
        });

        this.block.style.setProperty('--min-title-height', maxTitleHeight + 'px');
        this.update();
    }

    onClickItem (i) {
        if (!this.isManipulated) {
            this.goTo(i);
        }
    }

    handleArrows () {
        this.previous.addEventListener('click', () => {
            this.goTo(this.index-1);
        });

        this.next.addEventListener('click', () => {
            this.goTo(this.index+1);
        });
    }

    handlePointers () {
        let startX,
            endX,
            threshold = 30;
            // j'ai initialisé isPointerDown au début du code : this.isPointerDown
            // j'ai enlevé endEvents = ['pointerup'] parce qu'il était seul ?
        this.block.style.touchAction = 'pan-y';

        // on passe de this.content à this.block sur chaque événement pour grab sur tout le bloc
        this.block.addEventListener('pointerdown', (event) => {
            // On vérifie que l'on ne soit pas en train de cliquer sur les boutons (car on cible tout le bloc pour le grab)
            if (event.target !== this.next && event.target !== this.previous) {
                // on utilise partout this.isPointerDown car la navigation avec les arrow buguait
                // parfois ça naviguait de 2 items
                this.isPointerDown = true;
                this.content.classList.add('is-grabbing');
                startX = event.clientX;
            }
        });

        this.block.addEventListener('pointermove', (event) => {
            endX = event.clientX;
            // On vérifie que l'événement pointerdown a été activé
            if (this.isPointerDown) {
                event.preventDefault();
                this.items.forEach((item) => {
                    // on enlève le pointerevents pour que les liens ne soient pas cliquable au drag
                    item.style.pointerEvents = 'none';
                });
            }
        });

        // anciennement géré avec endEvents = ['pointerup'] (j'enlève le forEach)
        this.block.addEventListener('pointerup', (event) => {
            endX = event.clientX;
            // on vérifie encore isPointerDown pour éviter le pb des arrows
            if (this.isPointerDown) {
                this.isPointerDown = false;
                this.onManipulationEnd(startX, endX, threshold);
            }
        });
    }

    handleScroll () {
        // On écoute le scroll sur le contenu du bloc
        this.content.addEventListener('wheel', (event) => {
            const deltaX = event.deltaX,
                deltaY = event.deltaY;
            // navigation entre les items (comme onManipulationEnd)
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX !== 0) {
                    if (deltaX > 0) {
                        this.goTo(this.index + 1);
                    } else {
                        this.goTo(this.index - 1);
                    }
                }
            }
        });
    }

    onManipulationEnd (start, end, threshold) {
        if (start > end + threshold) {
            this.goTo(this.index+1);
        } else if (start < end - threshold) {
            this.goTo(this.index-1);
        }

        this.content.classList.remove('is-grabbing');
        this.items.forEach((item) => {
            // On rend le pointervents pour pouvoir cliquer sur le lien si on drag pas
            item.style.pointerEvents = 'all';
        });

        setTimeout(() => {
            this.isManipulated = false;
        }, 100);
    }

    goTo (_index) {
        this.index = Math.min(Math.max(_index, 0), this.items.length-1);
        this.update();
    }

    update () {
        this.list.style.marginLeft = `${-this.index * this.itemWidth}px`;

        this.items.forEach((item, index) => {
            if (index < this.index) {
                item.classList.add('is-passed');
            } else {
                item.classList.remove('is-passed');
            }
        });

        if (this.previous && this.next) {
            this.previous.disabled = this.index === 0;
            this.next.disabled = this.index === this.items.length - 1;
        }
    }
}

draggableBlocks.forEach((block) => {
    new DraggableBlock(block);
});
