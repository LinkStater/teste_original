require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
app.disable("x-powered-by");
app.use(express.json({limit:"20kb"}));
const allowedOrigin = process.env.FRONTEND_ORIGIN || "https://maikonchagas-coder.github.io";
app.use(cors({origin:(origin,cb)=>{if(!origin || origin===allowedOrigin || origin==="http://localhost:5500") return cb(null,true); cb(new Error("Origem não permitida."));},methods:["GET","POST","OPTIONS"],allowedHeaders:["Content-Type","X-Admin-Password"]}));
if(!process.env.DATABASE_URL || !process.env.ADMIN_PASSWORD) { console.error("Configure DATABASE_URL e ADMIN_PASSWORD nas variáveis seguras do host."); process.exit(1); }
const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:10000});
app.get("/api/health",async(_req,res)=>{try{await pool.query("SELECT 1");res.json({ok:true,database:"connected"});}catch(e){console.error(e.message);res.status(503).json({ok:false,error:"Falha na conexão com o banco."});}});
app.post("/api/avaliacoes",async(req,res)=>{
 const b=req.body||{}, code=String(b.projeto_codigo||"").trim().slice(0,80), name=String(b.projeto_nome||"").trim().slice(0,160), participant=String(b.participante||"").trim().slice(0,120), comment=String(b.comentario||"").trim().slice(0,500), nums=[Number(b.avaliacao_geral),Number(b.criatividade),Number(b.impacto)];
 if(!code||!name||!participant||nums.some(n=>!Number.isInteger(n)||n<1||n>5)) return res.status(400).json({error:"Confira nome, projeto e notas de 1 a 5."});
 try { const r=await pool.query("INSERT INTO avaliacoes_ranfy (projeto_codigo,projeto_nome,participante,avaliacao_geral,criatividade,impacto,comentario) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (projeto_codigo,participante) DO NOTHING RETURNING id",[code,name,participant,...nums,comment]); if(!r.rowCount)return res.status(409).json({error:"Este nome já avaliou este projeto."});res.status(201).json({ok:true,id:r.rows[0].id});}
 catch(e){console.error(e.message);res.status(500).json({error:"Não foi possível salvar a avaliação."});}
});
app.get("/api/dashboard",async(req,res)=>{
 if(req.get("X-Admin-Password")!==process.env.ADMIN_PASSWORD)return res.status(401).json({error:"Senha do painel incorreta."});
 try {
 const [tot,pes,dist,rec,rank]=await Promise.all([
 pool.query("SELECT COUNT(*)::int AS n FROM avaliacoes_ranfy"),
 pool.query("SELECT COUNT(DISTINCT participante)::int AS n FROM avaliacoes_ranfy"),
 pool.query("SELECT pergunta,nota,COUNT(*)::int AS quantidade FROM (SELECT 'Apresentação' pergunta,avaliacao_geral nota FROM avaliacoes_ranfy UNION ALL SELECT 'Criatividade',criatividade FROM avaliacoes_ranfy UNION ALL SELECT 'Impacto',impacto FROM avaliacoes_ranfy) q GROUP BY pergunta,nota ORDER BY pergunta,nota"),
 pool.query("SELECT participante,projeto_codigo,projeto_nome,avaliacao_geral,criatividade,impacto,comentario,criada_em FROM avaliacoes_ranfy ORDER BY criada_em DESC LIMIT 100"),
 pool.query("SELECT projeto_codigo,projeto_nome,COUNT(*)::int AS total,ROUND(AVG((avaliacao_geral+criatividade+impacto)::numeric/3),2) AS media FROM avaliacoes_ranfy GROUP BY projeto_codigo,projeto_nome ORDER BY media DESC,total DESC")
 ]);
 res.json({total:tot.rows[0].n,pessoas:pes.rows[0].n,distribuicao:dist.rows,recentes:rec.rows,ranking:rank.rows});
 } catch(e){console.error(e.message);res.status(500).json({error:"Falha ao carregar painel."});}
});
app.listen(process.env.PORT||3000,()=>console.log("Ranfy backend iniciado."));
