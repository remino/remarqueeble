/*! remarqueeble v0.2.0 | (c) 2026 Rémino Rem <https://remino.net/> | ISC Licence */
(function(e,t){typeof exports==`object`&&typeof module<`u`?t(exports):typeof define==`function`&&define.amd?define([`exports`],t):(e=typeof globalThis<`u`?globalThis:e||self,t(e.remarqueeble={}))})(this,function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t=`left`,n=`scroll`,r=6,i=85,a=60,o=`200px`,s=`calc(100% - (var(--attr-hspace, 0px) * 2))`,c=`direction`,l=`behavior`,u=`mode`,d=`scrollamount`,f=`scrolldelay`,p=`truespeed`,m=`loop`,h=`bgcolor`,g=`width`,_=`height`,v=`hspace`,y=`vspace`,b=`--attr-width`,x=`--attr-height`,S=`--attr-hspace`,C=`--attr-vspace`,w=`--attr-bgcolor`,T=`--animation-duration`,E=`--animation-direction`,D=`--animation-iteration-count`,O=`--animation-play-state`,k=`--animation-timing-function`,A=`--translate-x-end`,j=`--translate-x-start`,M=`--translate-y-end`,N=`--translate-y-start`,P=globalThis.HTMLElement??class{},F=e=>{if(e===null)return null;let t=e.trim();return t===``?null:/^[+-]?(?:\d+|\d*\.\d+)$/.test(t)?`${t}px`:globalThis.CSS?.supports(`width`,t)?t:null},I=[{attribute:g,cssVar:b,parser:F},{attribute:_,cssVar:x,parser:F,fallback(e){return e.isVerticalDirection&&!e.hasAttribute(_)?o:null}},{attribute:v,cssVar:S,parser:F},{attribute:y,cssVar:C,parser:F},{attribute:h,cssVar:w,parser:e=>{if(e===null)return null;let t=e.trim();return t===``?null:globalThis.CSS?.supports(`background-color`,t)?t:null}}],L=class extends P{static observedAttributes=[c,l,u,d,f,p,m,h,g,_,v,y];track;running=!1;position=0;lastTime=null;loopsDone=0;forward=!0;rafId=null;constructor(){super();let e=this.attachShadow({mode:`open`});e.innerHTML=`
			<style>
				:host {
					display: inline-block;
					text-align: initial;
					overflow: hidden !important;
					white-space: nowrap;
					width: var(${b}, ${s});
					height: var(${x}, auto);
					margin-inline: var(${S}, 0px);
					margin-block: var(${C}, 0px);
					background-color: var(${w}, transparent);
					box-sizing: border-box;
				}

				:host([direction="up"]),
				:host([direction="down"]) {
					white-space: normal;
				}

				.track {
					display: inline-block;
					will-change: transform;
				}

				:host([mode="css"]) .track {
					animation: remarqueeble-css-motion
						var(${T}, 10s)
						var(${k}, linear)
						var(${D}, infinite)
						var(${E}, normal)
						both;
					animation-play-state: var(${O}, running);
				}

				@keyframes remarqueeble-css-motion {
					from {
						transform: translate(
							var(${j}, 100%),
							var(${N}, 0px)
						);
					}

					to {
						transform: translate(
							var(${A}, -100%),
							var(${M}, 0px)
						);
					}
				}
			</style>

			<span class="track"><slot></slot></span>
		`;let t=e.querySelector(`.track`);if(!t)throw Error(`Remarqueeble track element was not created.`);this.track=t}connectedCallback(){this.running=!0,this.syncPresentationalHints(),requestAnimationFrame(()=>{!this.isConnected||!this.running||(this.reset(),this.isCssMode||this.tick())})}disconnectedCallback(){this.running=!1,this.lastTime=null,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}attributeChangedCallback(e,t,n){t!==n&&(this.syncPresentationalHints(),this.cancelTick(),this.isConnected&&(this.reset(),this.running&&!this.isCssMode&&this.tick()))}get direction(){return this.getAttribute(c)||t}get behavior(){return this.getAttribute(l)||n}get mode(){return this.getAttribute(u)||`js`}get scrollAmount(){let e=this.getAttribute(d),t=e===null||e.trim()===``?NaN:Number(e);return Number.isFinite(t)&&t>=0?t:r}get scrollDelay(){let e=this.getAttribute(f),t=e===null||e.trim()===``?NaN:Number(e),n=Number.isFinite(t)&&t>=0?t:i;return this.hasAttribute(p)?n:Math.max(n,a)}get loop(){let e=this.getAttribute(m);return e===null?-1:Number(e)}get directionSign(){return this.direction===`right`||this.direction===`down`?1:-1}get isVerticalDirection(){return this.direction===`up`||this.direction===`down`}get isCssMode(){return this.mode===`css`}start(){this.running||(this.running=!0,this.lastTime=null,this.syncAnimationPlayState(),this.isCssMode||this.tick())}stop(){this.running=!1,this.syncAnimationPlayState(),this.cancelTick()}cancelTick(){this.lastTime=null,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}syncPresentationalHints(){for(let e of I)this.syncVar(e);this.syncAnimationPlayState()}syncVar(e){let t=this.getAttribute(e.attribute),n=e.parser(t),r=e.fallback?e.fallback(this):null;if(n==null){r==null?this.style.removeProperty(e.cssVar):this.style.setProperty(e.cssVar,r);return}this.style.setProperty(e.cssVar,n)}reset(){let e=this.getHostSize(),t=this.getTrackSize();this.loopsDone=0,this.forward=!0,this.position=this.behavior===`alternate`?this.getAlternateStartPosition(e,t):this.getStartPosition(e,t),this.isCssMode?this.syncCssAnimation(e,t):(this.clearCssAnimation(),this.render())}getHostSize(){return this.isVerticalDirection?this.clientHeight:this.clientWidth}getTrackSize(){return this.isVerticalDirection?this.track.offsetHeight:this.track.offsetWidth}getStartPosition(e,t){return this.directionSign<0?e:-t}getFlushEndPosition(e,t){return this.directionSign<0?0:e-t}getOffEndPosition(e,t){return this.directionSign<0?-t:e}getSlideEndPosition(e,t){return this.directionSign<0?0:e-t}getAlternateStartPosition(e,t){return this.directionSign<0?e-t:0}tick(e=performance.now()){this.running&&(this.lastTime===null&&(this.lastTime=e),e-this.lastTime>=this.scrollDelay&&(this.step(),this.lastTime=e),this.running&&(this.rafId=requestAnimationFrame(e=>this.tick(e))))}step(){let e=this.getHostSize(),t=this.getTrackSize(),n=this.getStartPosition(e,t),r=this.getFlushEndPosition(e,t),i=this.getOffEndPosition(e,t),a=this.getSlideEndPosition(e,t),o=this.getAlternateStartPosition(e,t),s=this.scrollAmount,c=this.directionSign*s;this.behavior===`alternate`?(this.position+=this.forward?c:-c,this.forward?(this.directionSign<0&&this.position<=r||this.directionSign>0&&this.position>=r)&&(this.position=r,this.forward=!1,this.incrementLoopCount(),this.shouldStopAfterLoop()&&this.stop()):(this.directionSign<0&&this.position>=o||this.directionSign>0&&this.position<=o)&&(this.position=o,this.forward=!0,this.incrementLoopCount(),this.shouldStopAfterLoop()&&this.stop())):this.behavior===`slide`?(this.position+=c,(this.directionSign<0&&this.position<=a||this.directionSign>0&&this.position>=a)&&(this.position=a,this.incrementLoopCount(),!this.hasAttribute(m)||this.loop<=0||this.shouldStopAfterLoop()?this.stop():this.position=n)):(this.position+=c,(this.directionSign<0&&this.position<=i||this.directionSign>0&&this.position>=i)&&(this.position=n,this.incrementLoopCount(),this.shouldStopAfterLoop()&&this.stop())),this.render()}incrementLoopCount(){this.loopsDone++}shouldStopAfterLoop(){return this.hasAttribute(m)&&this.loop>0&&this.loopsDone>=this.loop}syncAnimationPlayState(){this.style.setProperty(O,this.running?`running`:`paused`)}syncCssAnimation(e,t){let n=this.behavior===`alternate`?this.getAlternateStartPosition(e,t):this.getStartPosition(e,t),r=this.behavior===`slide`?this.getSlideEndPosition(e,t):this.behavior===`alternate`?this.getFlushEndPosition(e,t):this.getOffEndPosition(e,t),i=Math.abs(r-n),a=Math.max(1,Math.ceil(i/Math.max(1,this.scrollAmount))),o=Math.max(1,a*this.scrollDelay),s=this.getCssIterationCount();this.track.style.removeProperty(`transform`),this.style.setProperty(T,`${o}ms`),this.style.setProperty(E,this.behavior===`alternate`?`alternate`:`normal`),this.style.setProperty(D,s),this.style.setProperty(k,`steps(${a}, end)`),this.isVerticalDirection?(this.style.setProperty(j,`0px`),this.style.setProperty(A,`0px`),this.style.setProperty(N,`${n}px`),this.style.setProperty(M,`${r}px`)):(this.style.setProperty(j,`${n}px`),this.style.setProperty(A,`${r}px`),this.style.setProperty(N,`0px`),this.style.setProperty(M,`0px`))}clearCssAnimation(){this.style.removeProperty(T),this.style.removeProperty(E),this.style.removeProperty(D),this.style.removeProperty(k),this.style.removeProperty(j),this.style.removeProperty(A),this.style.removeProperty(N),this.style.removeProperty(M)}getCssIterationCount(){return this.behavior===`slide`&&!this.hasAttribute(m)?`1`:!this.hasAttribute(m)||this.loop<=0?`infinite`:String(this.loop)}render(){this.isVerticalDirection?this.track.style.transform=`translateY(${this.position}px)`:this.track.style.transform=`translateX(${this.position}px)`}},R=()=>{typeof customElements>`u`||(customElements.get(`re-marquee`)||customElements.define(`re-marquee`,L),customElements.get(`re-marquee-ble`)||customElements.define(`re-marquee-ble`,L))};R(),e.defineRemarqueebleElements=R});