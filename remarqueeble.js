class ReMarquee extends HTMLElement {
	static observedAttributes = [
		'direction',
		'behavior',
		'scrollamount',
		'scrolldelay',
		'loop',
	]

	constructor() {
		super()

		this.attachShadow({ mode: 'open' })

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          overflow: hidden;
          white-space: nowrap;
        }

        .track {
          display: inline-block;
          will-change: transform;
        }
      </style>

      <span class="track"><slot></slot></span>
    `

		this.track = this.shadowRoot.querySelector('.track')
		this.running = true
		this.position = 0
		this.lastTime = null
		this.loopsDone = 0
		this.forward = true
	}

	connectedCallback() {
		requestAnimationFrame(() => {
			this.reset()
			this.tick()
		})
	}

	disconnectedCallback() {
		this.running = false
	}

	attributeChangedCallback() {
		this.reset()
	}

	get direction() {
		return this.getAttribute('direction') || 'left'
	}

	get behavior() {
		return this.getAttribute('behavior') || 'scroll'
	}

	get scrollAmount() {
		return Number(this.getAttribute('scrollamount') || 6)
	}

	get scrollDelay() {
		return Number(this.getAttribute('scrolldelay') || 85)
	}

	get loop() {
		const value = this.getAttribute('loop')
		return value === null ? -1 : Number(value)
	}

	start() {
		if (this.running) return
		this.running = true
		this.lastTime = null
		requestAnimationFrame(() => this.tick())
	}

	stop() {
		this.running = false
	}

	reset() {
		const hostSize = this.isVertical() ? this.clientHeight : this.clientWidth

		const trackSize = this.isVertical()
			? this.track.offsetHeight
			: this.track.offsetWidth

		this.loopsDone = 0
		this.forward = true

		if (this.direction === 'right' || this.direction === 'down') {
			this.position = -trackSize
		} else {
			this.position = hostSize
		}

		this.render()
	}

	isVertical() {
		return this.direction === 'up' || this.direction === 'down'
	}

	tick(time = performance.now()) {
		if (!this.running) return

		if (this.lastTime === null) this.lastTime = time

		const elapsed = time - this.lastTime

		if (elapsed >= this.scrollDelay) {
			this.step()
			this.lastTime = time
		}

		requestAnimationFrame(t => this.tick(t))
	}

	step() {
		const hostSize = this.isVertical() ? this.clientHeight : this.clientWidth

		const trackSize = this.isVertical()
			? this.track.offsetHeight
			: this.track.offsetWidth

		const amount = this.scrollAmount

		if (this.behavior === 'alternate') {
			this.position += this.forward ? amount : -amount

			if (this.position + trackSize >= hostSize) {
				this.position = hostSize - trackSize
				this.forward = false
				this.countLoop()
			} else if (this.position <= 0) {
				this.position = 0
				this.forward = true
				this.countLoop()
			}
		} else {
			const positive = this.direction === 'right' || this.direction === 'down'

			this.position += positive ? amount : -amount

			if (!positive && this.position < -trackSize) {
				this.position = hostSize
				this.countLoop()
			}

			if (positive && this.position > hostSize) {
				this.position = -trackSize
				this.countLoop()
			}
		}

		this.render()
	}

	countLoop() {
		this.loopsDone++

		if (this.loop > 0 && this.loopsDone >= this.loop) {
			this.stop()
		}
	}

	render() {
		if (this.isVertical()) {
			this.track.style.transform = `translateY(${this.position}px)`
		} else {
			this.track.style.transform = `translateX(${this.position}px)`
		}
	}
}

customElements.define('re-marquee', ReMarquee)
