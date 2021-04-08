/*var tmpl = null;
document.addEventListener('DOMContentLoaded', function() {
	tmpl = document.getElementsByTagName('template');
}, false);*/

const tmpl = document.createElement('template');
tmpl.innerHTML = `
	<link rel="stylesheet" href="poke-card.css">
	<div id="card-div" class="card">
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
		return ['no', 'nickname' , 'type'];
	}

	attributeChangedCallback(name, oldVal, newVal) {
		switch(name) {
			case 'no':
				var sprite = this.shadowRoot.getElementById('spriteimg');
				sprite.onload = function() {
					this.style.width = this.width * 0.75
					this.style.height = 'auto'
				}
				sprite.src = '../assets/sprites/' + newVal.padStart(3, '0') + '.gif';
				break;
			case 'nickname':
				var nickname = this.shadowRoot.getElementById('nickname');
				nickname.innerHTML = newVal;
				break;
			case 'type':
				var type = JSON.parse( newVal );
				var div = this.shadowRoot.getElementById("card-div");
				if ( type.length == 2 ) {
					div.style.backgroundColor = this.colorLookup( type[0] ); // for browsers that dont support gradients
					div.style.backgroundImage = "linear-gradient( to bottom right , " + this.colorLookup( type[0] ) + " , " + this.colorLookup( type[1] ) + " )";
				} else if ( type.length == 1 ) {
					div.style.backgroundColor = this.colorLookup( type[0] );
				}
				break;
			default:
				break;
		}
	}

	colorLookup( type ) {
		var table = {
			"Normal" : "#A8A878",
			"Fighting" : "#C03028",
			"Flying" : "#A890F0",
			"Poison" : "#A040A0",
			"Ground" : "#E0C068",
			"Rock" : "#A8B820",
			"Bug" : "#A8B820",
			"Ghost" : "#705898",
			"Steel" : "#B8B8D0",
			"Fire" : "#F08030",
			"Water" : "#6890F0",
			"Grass" : "#78C850",
			"Electric" : "#F8D030",
			"Psychic" : "#F85888",
			"Ice" : "#98D8D8",
			"Dragon" : "#7038F8",
			"Dark" : "#705848",
			"???" : "#68A090"
		}
		if ( type in table ) {
			return table[ type ];
		} else {
			return "#FFFFFF";
		}
	}
}

window.customElements.define('poke-card', PokeCard);
