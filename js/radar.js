console.log("🚀 radar.js cargado");
console.log("typeof partidos:", typeof partidos);
console.log("✅ actualizarRadar registrada");

let todasLasQuinielas = {};
let resultadosSistema = {};
let fasesSistema = {};
function mostrarRadarPrueba() {

    const radar = document.getElementById("radarPartido");

    if (!radar) return;

    const usuarios = Object.keys(todasLasQuinielas);

    radar.innerHTML = `

        <h3>🔥 Así va la Quiniela</h3>

        <div style="margin-top:15px">

            👥 Participantes cargados:
            <b>${usuarios.length}</b>

        </div>

        <div style="margin-top:10px">

            ${usuarios.slice(0,5).join("<br>")}

        </div>

    `;

}
async function cargarTodasLasQuinielas(){

    try{

        const res = await fetch(
            "https://quiniela-mundial-juansantos-default-rtdb.firebaseio.com/quinielas.json"
        );

        todasLasQuinielas = await res.json() || {};

        console.log(
            "✅ Quinielas cargadas:",
            Object.keys(todasLasQuinielas).length
        );

        //mostrarRadarPrueba();

    }catch(e){

        console.error(
            "Error cargando quinielas",
            e
        );

    }

}

function generarRadarHTML(partido){

    console.log("Entró a generarRadarHTML");

    const infoPartido = obtenerPartidoSistema(partido);

    console.log("infoPartido =", infoPartido);

    if(!infoPartido) return "";

    const partidoSistema = infoPartido.partido;

    const aciertos = buscarAciertos(partidoSistema, partido, infoPartido.invertido);

    const exactos = aciertos.exactos;

    const ganador = aciertos.ganador;
    console.log("🏟️ Partido:", partido.homeTeam.name, "vs", partido.awayTeam.name);
    console.log("🎯 Exactos:", exactos);
    console.log("⚽ Ganador:", ganador);
    return `

    <div style="
        text-align:center;
        margin-bottom:30px;
        padding-bottom:20px;
        border-bottom:1px solid #ddd;
    ">

        <h3>🔥 ASÍ VA LA QUINIELA</h3>

        <div style="
            font-size:24px;
            font-weight:bold;
            margin:18px 0;
        ">

            ${partido.homeTeam.name}

            <span style="color:#1e3c72;">
                ${partido.score.fullTime.home ?? 0}
            </span>

            -

            <span style="color:#1e3c72;">
                ${partido.score.fullTime.away ?? 0}
            </span>

            ${partido.awayTeam.name}

        </div>

        <div style="
            max-width:450px;
            margin:auto;
            text-align:left;
        ">

            <h4>🎯 Le están atinando al marcador</h4>

            ${
                exactos.length
                ? exactos.slice(0,3).map((n,i)=>
                    `${["🥇","🥈","🥉"][i]} ${n}`
                ).join("<br>")
                : "<span style='color:#888'>Nadie por ahora</span>"
            }

            ${
exactos.length > 3
? `
<br><br>

<details>

<summary style="
cursor:pointer;
color:#1e3c72;
font-weight:bold;
">

🎯 Ver los ${exactos.length-3} restantes

</summary>

<div style="margin-top:10px;">

${exactos.slice(3).map(n=>`👤 ${n}`).join("<br>")}

</div>

</details>
`
: ""
}

            <br><br>

            <h4>⚽ También aciertan el ganador</h4>

            ${
                ganador.length
                ? ganador.slice(0,3).map(n=>
                    `👤 ${n}`
                ).join("<br>")
                : "<span style='color:#888'>Nadie</span>"
            }

            ${
ganador.length > 3
? `
<br><br>

<details>

<summary style="
cursor:pointer;
color:#1e3c72;
font-weight:bold;
">

👥 Ver los ${ganador.length-3} restantes

</summary>

<div style="margin-top:10px;">

${ganador.slice(3).map(n=>`👤 ${n}`).join("<br>")}

</div>

</details>
`
: ""
}

        </div>

    </div>

    `;

}

function buscarAciertos(partidoSistema, partidoVivo, invertido = false){

    const exactos = [];
    const ganador = [];

    if(!partidoSistema){
        return { exactos, ganador };
    }

    let golesLocal = partidoVivo.score.fullTime.home ?? 0;
let golesVisitante = partidoVivo.score.fullTime.away ?? 0;

// Si el partido viene invertido, intercambiamos los goles
if(invertido){
    [golesLocal, golesVisitante] = [golesVisitante, golesLocal];
}

    let resultadoActual = "E";

    if(golesLocal > golesVisitante){
        resultadoActual = "L";
    }else if(golesVisitante > golesLocal){
        resultadoActual = "V";
    }

    for(const nombre in todasLasQuinielas){

        const usuario = todasLasQuinielas[nombre];

        if(!usuario.grupos) continue;

        for(const grupo in usuario.grupos){

            const datosGrupo = usuario.grupos[grupo];

            if(!datosGrupo.pronosticos) continue;

            for(const pronostico of datosGrupo.pronosticos){

                if(pronostico.partidoId != partidoSistema.id){
                    continue;
                }

           // Marcador exacto
if(
    Number(pronostico.golesLocal) === golesLocal &&
    Number(pronostico.golesVisitante) === golesVisitante
){

    if(!exactos.includes(nombre)){
        exactos.push(nombre);
    }

    continue;

}
                // Resultado (Local / Empate / Visitante)
                let resultadoPronostico = "E";

                if(pronostico.golesLocal > pronostico.golesVisitante){
                    resultadoPronostico = "L";
                }else if(pronostico.golesVisitante > pronostico.golesLocal){
                    resultadoPronostico = "V";
                }

                if(resultadoPronostico === resultadoActual){

    console.log(
        "✅ Acierta ganador:",
        nombre,
        pronostico.local,
        pronostico.golesLocal + "-" + pronostico.golesVisitante
    );

    if(!ganador.includes(nombre)){
        ganador.push(nombre);
    }

}

            }

        }

    }

    return {
        exactos,
        ganador
    };

}


function obtenerPartidoSistema(partidoVivo){

    const local = normalizarNombreEquipo(partidoVivo.homeTeam.name);
    const visitante = normalizarNombreEquipo(partidoVivo.awayTeam.name);

    for(const partido of partidos){

        const localSistema = normalizarNombreEquipo(partido.local);
        const visitanteSistema = normalizarNombreEquipo(partido.visitante);

        // Coincidencia normal
        if(
            localSistema === local &&
            visitanteSistema === visitante
        ){
            return {
                partido,
                invertido: false
            };
        }

        // Coincidencia invertida
        if(
            localSistema === visitante &&
            visitanteSistema === local
        ){
            return {
                partido,
                invertido: true
            };
        }

    }
    console.log(
    "No encontró:",
    local,
    "-",
    visitante
);
    return null;

}
function normalizarNombreEquipo(nombre){

    const equivalencias = {

    "Germany":"Alemania",
    "Mexico":"México",
    "Japan":"Japón",
    "South Korea":"República de Corea",
    "Czechia":"Chequia",
    "Netherlands":"Países Bajos",
    "Ivory Coast":"Costa de Marfil",
    "Curacao":"Curazao",
    "Cape Verde Islands":"Islas de Cabo Verde",
    "Cape Verde":"Islas de Cabo Verde",
    "Saudi Arabia":"Arabia Saudí",
    "Iran":"RI de Irán",
    "IR Iran":"RI de Irán",
    "Bosnia-Herzegovina":"Bosnia y Herzegovina",
    "Bosnia and Herzegovina":"Bosnia y Herzegovina",
    "United States":"EE. UU.",
    "USA":"EE. UU.",
    "Turkey":"Turquía",
    "Congo DR":"RD Congo",
    "DR Congo":"RD Congo",
    "Tunisia":"Túnez",

    // Por si la API usa estos nombres
    "South Africa":"Sudáfrica",
    "Switzerland":"Suiza",
    "Sweden":"Suecia",
    "Scotland":"Escocia",
    "Morocco":"Marruecos",
    "Brazil":"Brasil",
    "Haiti":"Haití",
    "Australia":"Australia",
    "Paraguay":"Paraguay",
    "Belgium":"Bélgica",
    "Egypt":"Egipto",
    "New Zealand":"Nueva Zelanda",
    "Spain":"España",
    "Uruguay":"Uruguay",
    "France":"Francia",
    "Senegal":"Senegal",
    "Iraq":"Irak",
    "Norway":"Noruega",
    "Argentina":"Argentina",
    "Algeria":"Argelia",
    "Austria":"Austria",
    "Jordan":"Jordania",
    "Portugal":"Portugal",
    "Uzbekistan":"Uzbekistán",
    "Colombia":"Colombia",
    "England":"Inglaterra",
    "Croatia":"Croacia",
    "Ghana":"Ghana",
    "Panama":"Panamá",
    "Qatar":"Catar",
    "Ecuador":"Ecuador",
    "Canada":"Canadá"

};

return equivalencias[nombre.trim()] || nombre.trim();

}
window.generarRadarHTML = generarRadarHTML;