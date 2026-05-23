const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

/* =========================================
   LEER DB
========================================= */

function leerDB(){

  return JSON.parse(
    fs.readFileSync(DB_FILE)
  );

}

/* =========================================
   GUARDAR DB
========================================= */

function guardarDB(data){

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data,null,2)
  );

}

/* =========================================
   GUARDAR QUINIELA
========================================= */

app.post("/guardar-quiniela",(req,res)=>{

  const db = leerDB();

  const existe = db.quinielas.find(
    q => q.usuario === req.body.usuario
  );

  if(existe){

    return res.status(400).json({
      error:"Usuario ya existe"
    });

  }

  db.quinielas.push(req.body);

  guardarDB(db);

  res.json({
    ok:true
  });

});

/* =========================================
   GUARDAR RESULTADO REAL
========================================= */

app.post("/guardar-resultado",(req,res)=>{

  const db = leerDB();

  const resultado = req.body;

  db.resultados = db.resultados.filter(
    r => r.partidoId !== resultado.partidoId
  );

  db.resultados.push(resultado);

  calcularRanking(db);

  guardarDB(db);

  res.json({
    ok:true
  });

});

/* =========================================
   AGREGAR PARTIDO EXTRA
========================================= */

app.post("/agregar-partido",(req,res)=>{

  const db = leerDB();

  const partido = req.body;

  db.partidosExtras.push(partido);

  guardarDB(db);

  res.json({
    ok:true
  });

});

/* =========================================
   OBTENER PARTIDOS EXTRA
========================================= */

app.get("/partidos-extras",(req,res)=>{

  const db = leerDB();

  res.json(db.partidosExtras);

});

/* =========================================
   OBTENER TODOS LOS PARTIDOS
========================================= */

app.get("/todos-partidos",(req,res)=>{

  const db = leerDB();

  res.json({

    extras:db.partidosExtras

  });

});

/* =========================================
   OBTENER RANKING
========================================= */

app.get("/ranking",(req,res)=>{

  const db = leerDB();

  res.json(db.ranking);

});

/* =========================================
   OBTENER GANADOR
========================================= */

function obtenerGanador(gl,gv){

  if(gl > gv){
    return "LOCAL";
  }

  if(gv > gl){
    return "VISITANTE";
  }

  return "EMPATE";

}

/* =========================================
   CALCULAR RANKING
========================================= */

function calcularRanking(db){

  let ranking = [];

  db.quinielas.forEach(q=>{

    let puntos = 0;

    q.pronosticos.forEach(p=>{

      const real = db.resultados.find(
        r => r.partidoId === p.partidoId
      );

      if(!real) return;

      const ganadorUsuario =
        obtenerGanador(
          p.golesLocal,
          p.golesVisitante
        );

      const ganadorReal =
        obtenerGanador(
          real.golesLocal,
          real.golesVisitante
        );

      if(
        ganadorUsuario === ganadorReal
      ){
        puntos++;
      }

    });

    ranking.push({

      nombre:q.usuario,

      puntos

    });

  });

  ranking.sort((a,b)=>b.puntos-a.puntos);

  db.ranking = ranking;

}

/* =========================================
   RESET DB
========================================= */

app.post("/reset",(req,res)=>{

  const nuevaDB = {

    quinielas:[],

    resultados:[],

    ranking:[],

    partidosExtras:[]

  };

  guardarDB(nuevaDB);

  res.json({

    ok:true

  });

});

/* =========================================
   SERVER
========================================= */

app.listen(3000,()=>{

  console.log(
    "🔥 Servidor corriendo en puerto 3000"
  );

});