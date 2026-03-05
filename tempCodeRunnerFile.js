



const pokemonCount = 151
var pokedex = {} // {1 : {"name" : "bulbasaur", "img" : url, "type" : ["grass", "poison"], "desc" : "...."}}



window.onload = async function() {
    getPokemon(2);
}

async function getPokemon(num) {
    let url = "https://pokeapi.co/api/v2/pokemon" + num.toString();

    let res = await fetch(url);
    let pokemon = await res.json();
    console.log(pokemon)

}       