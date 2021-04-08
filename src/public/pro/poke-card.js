/*var tmpl = null;
document.addEventListener('DOMContentLoaded', function() {
	tmpl = document.getElementsByTagName('template');
}, false);*/

const tmpl = document.createElement('template');
tmpl.innerHTML = `
	<link rel="stylesheet" href="poke-card.css">
	<div class="card">
		<div id="sprite">
			<span class="vertical-align"></span>
			<img id="spriteimg" src="" alt="">
		</div>
		<div id="nicknamediv">
			<p id="nickname"></p>
		</div>
	</div>
`;

class PokeCard extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(tmpl.content.cloneNode(true));
	}

	static get observedAttributes() {
		return ['no', 'nickname'];
	}

	attributeChangedCallback(name, oldVal, newVal) {
		switch(name) {
			case 'no':
				var sprite = this.shadowRoot.querySelector('img');
				sprite.onload = function() {
					this.style.width = this.width * 0.75
					this.style.height = 'auto'
				}
				sprite.src = '../assets/sprites/' + newVal.padStart(3, '0') + '.gif';
				break;
			case 'nickname':
				var name = this.shadowRoot.getElementById('nickname');
				name.innerHTML = newVal;
			default:
				break;
		}
	}
}

window.customElements.define('poke-card', PokeCard);