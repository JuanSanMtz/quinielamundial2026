const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");
const partidos = require("./partidos");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.testFirebase = onRequest(async (req, res) => {

  const fecha = new Date().toISOString();

  await admin
    .database()
    .ref("ultimaActualizacion")
    .set({
      fecha
    });

  res.send(
    `Firebase OK - ${fecha}`
  );

});

const axios = require("axios");

exports.probarFootballData = onRequest(async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
        }
      }
    );

    res.json({
      total: response.data.matches.length,
      primerPartido: response.data.matches[0]
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

exports.probarGrupoA = onRequest(async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
        }
      }
    );

    const equivalencias = {
      "Mexico": "México",
      "South Africa": "Sudáfrica",
      "South Korea": "República de Corea",
      "Czechia": "Chequia"
    };

    const grupoA = response.data.matches
      .filter(m => m.group === "GROUP_A")
      .map(m => ({

        apiId: m.id,

        local:
          equivalencias[m.homeTeam.name] ||
          m.homeTeam.name,

        visitante:
          equivalencias[m.awayTeam.name] ||
          m.awayTeam.name,

        golesLocal:
          m.score?.fullTime?.home ?? 0,

        golesVisitante:
          m.score?.fullTime?.away ?? 0,

        finalizado:
          m.status === "FINISHED"

      }));

    res.json(grupoA);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

exports.actualizarResultadosMundial = onRequest((req, res) => {

  cors(req, res, async () => {
  try {

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
        }
      }
    );

    const equivalencias = {
      "Mexico": "México",
      "South Africa": "Sudáfrica",
      "South Korea": "República de Corea",
      "Czechia": "Chequia",
      "Bosnia-Herzegovina": "Bosnia y Herzegovina",
      "United States": "EE. UU.",
      "Ivory Coast": "Costa de Marfil",
      "Netherlands": "Países Bajos",
      "Iran": "RI de Irán",
      "Cape Verde Islands": "Islas de Cabo Verde",
      "Saudi Arabia": "Arabia Saudí",
      "Congo DR": "RD Congo",
      "Curacao": "Curazao",
      "Turkey": "Turquía",
      "Canada": "Canadá",
      "Qatar": "Catar",
      "Brazil": "Brasil",
      "Morocco": "Marruecos",
      "Germany": "Alemania",
      "Japan": "Japón",
      "Sweden": "Suecia",
      "Tunisia": "Túnez",
      "Belgium": "Bélgica",
      "Spain": "España",
      "France": "Francia",
      "England": "Inglaterra",
      "Croatia": "Croacia",
      "Ghana": "Ghana",
      "Panama": "Panamá",
      "Portugal": "Portugal",
      "Colombia": "Colombia",
      "Argentina": "Argentina",
      "Austria": "Austria",
      "Algeria": "Argelia",
      "Jordan": "Jordania",
      "Uruguay": "Uruguay",
      "Senegal": "Senegal",
      "Norway": "Noruega",
      "Iraq": "Irak",
      "Paraguay": "Paraguay",
      "Australia": "Australia",
      "Ecuador": "Ecuador",
      "Haiti": "Haití",
      "Scotland": "Escocia",
      "Switzerland": "Suiza",
      "New Zealand": "Nueva Zelanda",
      "Egypt": "Egipto",
      "Uzbekistan": "Uzbekistán"
    };

    const resultadosPorGrupo = {};

    response.data.matches.forEach(m => {

      if (!m.group || !m.group.startsWith("GROUP_")) {
        return;
      }

      const local =
        (equivalencias[m.homeTeam.name] || m.homeTeam.name)
          .replace("Curaçao", "Curazao");

      const visitante =
        (equivalencias[m.awayTeam.name] || m.awayTeam.name)
          .replace("Curaçao", "Curazao");

      const partido = partidos.find(p =>

        (
          p.local === local &&
          p.visitante === visitante
        )

        ||

        (
          p.local === visitante &&
          p.visitante === local
        )

      );

      if (!partido) return;

      if (!resultadosPorGrupo[partido.grupo]) {
        resultadosPorGrupo[partido.grupo] = [];
      }

      resultadosPorGrupo[partido.grupo].push({

        partidoId: partido.id,

        local,
        visitante,

        golesLocal:
          m.score?.fullTime?.home ?? 0,

        golesVisitante:
          m.score?.fullTime?.away ?? 0,

        finalizado:
          m.status === "FINISHED"

      });

    });

    for (const grupo of Object.keys(resultadosPorGrupo)) {

      resultadosPorGrupo[grupo].sort(
        (a, b) => a.partidoId - b.partidoId
      );

      await admin
        .database()
        .ref(`resultados/${grupo}`)
        .set(resultadosPorGrupo[grupo]);

    }

    res.json({
      ok: true,
      gruposActualizados: Object.keys(resultadosPorGrupo),
      totalGrupos: Object.keys(resultadosPorGrupo).length
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

  });

});

exports.listarEquiposMundial = onRequest(async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
        }
      }
    );

    const equipos = new Set();

    response.data.matches.forEach(m => {
      equipos.add(m.homeTeam.name);
      equipos.add(m.awayTeam.name);
    });

    res.json(Array.from(equipos).sort());

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

exports.probarCatalogo = onRequest(async (req, res) => {

  res.json({
    total: partidos.length,
    primero: partidos[0],
    ultimo: partidos[71]
  });

});

exports.validarMapeo = onRequest(async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
        }
      }
    );

    const equivalencias = {
  "Mexico": "México",
  "South Africa": "Sudáfrica",
  "South Korea": "República de Corea",
  "Czechia": "Chequia",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "United States": "EE. UU.",
  "Ivory Coast": "Costa de Marfil",
  "Netherlands": "Países Bajos",
  "Iran": "RI de Irán",
  "Cape Verde Islands": "Islas de Cabo Verde",
  "Saudi Arabia": "Arabia Saudí",
  "Congo DR": "RD Congo",
  "Curacao": "Curazao",
  "Turkey": "Turquía",
  "Canada": "Canadá",
  "Qatar": "Catar",
  "Brazil": "Brasil",
  "Morocco": "Marruecos",
  "Germany": "Alemania",
  "Japan": "Japón",
  "Sweden": "Suecia",
  "Tunisia": "Túnez",
  "Belgium": "Bélgica",
  "Spain": "España",
  "France": "Francia",
  "England": "Inglaterra",
  "Croatia": "Croacia",
  "Ghana": "Ghana",
  "Panama": "Panamá",
  "Portugal": "Portugal",
  "Colombia": "Colombia",
  "Argentina": "Argentina",
  "Austria": "Austria",
  "Algeria": "Argelia",
  "Jordan": "Jordania",
  "Uruguay": "Uruguay",
  "Senegal": "Senegal",
  "Norway": "Noruega",
  "Iraq": "Irak",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Ecuador": "Ecuador",
  "Haiti": "Haití",
  "Scotland": "Escocia",
  "Switzerland": "Suiza",
  "New Zealand": "Nueva Zelanda",
  "Egypt": "Egipto",
  "Uzbekistan": "Uzbekistán"
};

    const encontrados = [];
    const noEncontrados = [];

    response.data.matches.forEach(m => {

      if (!m.group || !m.group.startsWith("GROUP_")) {
        return;
      }

    const local =
  (equivalencias[m.homeTeam.name] || m.homeTeam.name)
    .replace("Curaçao", "Curazao");

const visitante =
  (equivalencias[m.awayTeam.name] || m.awayTeam.name)
    .replace("Curaçao", "Curazao");

const partido = partidos.find(p =>

  (
    p.local === local &&
    p.visitante === visitante
  )

  ||

  (
    p.local === visitante &&
    p.visitante === local
  )

);

      if (partido) {

        encontrados.push({
          partidoId: partido.id,
          grupo: partido.grupo,
          local,
          visitante
        });

      } else {

        noEncontrados.push({
          local,
          visitante
        });

      }

    });

  res.json(noEncontrados);
  
  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

exports.calcularRanking = onRequest(async (req, res) => {

  try {

    const quinielasSnap = await admin.database().ref("quinielas").once("value");
    const resultadosSnap = await admin.database().ref("resultados").once("value");

    const quinielas = quinielasSnap.val() || {};
    const resultados = resultadosSnap.val() || {};

    const ranking = {};

    Object.keys(quinielas).forEach(nombreJugador => {

      let puntos = 0;
      let exactos = 0;

      const grupos = quinielas[nombreJugador]?.grupos || {};

      Object.keys(grupos).forEach(grupo => {

        const pronosticos = grupos[grupo]?.pronosticos || [];
        const resultadosGrupo = resultados[grupo] || [];

        pronosticos.forEach(pronostico => {

          const resultado = resultadosGrupo.find(r =>
            r.partidoId === pronostico.partidoId &&
            r.finalizado === true
          );

          if (!resultado) return;

          const pronLocal = Number(pronostico.golesLocal);
          const pronVisit = Number(pronostico.golesVisitante);

          const realLocal = Number(resultado.golesLocal);
          const realVisit = Number(resultado.golesVisitante);

          let signoPron = "E";
          let signoReal = "E";

          if (pronLocal > pronVisit) signoPron = "L";
          if (pronLocal < pronVisit) signoPron = "V";

          if (realLocal > realVisit) signoReal = "L";
          if (realLocal < realVisit) signoReal = "V";

          // +1 ganador/empate
          if (signoPron === signoReal) {
            puntos++;
          }

          // +1 marcador exacto
          if (
            pronLocal === realLocal &&
            pronVisit === realVisit
          ) {
            puntos++;
            exactos++;
          }

        });

      });

      ranking[nombreJugador] = {
        puntos,
        exactos
      };

    });

    await admin
      .database()
      .ref("ranking")
      .set(ranking);

    res.json({
      ok: true,
      jugadores: Object.keys(ranking).length,
      ranking
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

exports.obtenerMarcadoresVivo = onRequest((req, res) => {

  cors(req, res, async () => {

    try {

      const response = await axios.get(
        "https://api.football-data.org/v4/competitions/WC/matches",
        {
          headers: {
            "X-Auth-Token": "10acb3f3f0d54f00851fcb9d933ad7ff"
          }
        }
      );

      const partidosVivo = response.data.matches
        .filter(m =>
          m.status === "LIVE" ||
          m.status === "IN_PLAY" ||
          m.status === "PAUSED"
        )
        .map(m => ({

          id: m.id,

          local: m.homeTeam.name,
          visitante: m.awayTeam.name,

          golesLocal:
            m.score?.fullTime?.home ?? 0,

          golesVisitante:
            m.score?.fullTime?.away ?? 0,

          minuto:
            m.minute || 0,

          estado:
            m.status

        }));

      res.json(partidosVivo);

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }

  });

});