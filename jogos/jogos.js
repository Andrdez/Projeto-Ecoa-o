
const canvas = document.getElementById("meuCanvas");
const ctx = canvas.getContext("2d");

const telaInicial = document.getElementById("telaInicial");
const botaoJogar = document.getElementById("botaoJogar");
const botaoInstrucoes = document.getElementById("botaoInstrucoes");
const botaoFechar = document.getElementById("botaoFechar");
const instrucoes = document.getElementById("instrucoes");

const fundo = new Image();
fundo.src = "../imagens/Cidade ecológica pixelada ao entardecer.png";

const imagensFim = {
    vitoria: new Image(),
    derrota: new Image(),
    ratinhoFeliz: new Image(),
    ratinhoTriste: new Image()
};

imagensFim.vitoria.src = "../imagens/Cidade Pixel Verde e Radiante.png";
imagensFim.derrota.src = "../imagens/Cidade Em Ruínas ao Pôr do Sol.png";
imagensFim.ratinhoFeliz.src = "../imagens/mascote.png";
imagensFim.ratinhoTriste.src = "../imagens/Ratinho Triste na Floresta Pixelada.png";

Object.values(imagensFim).forEach(imagem => {
    imagem.onload = desenharJogo;
    imagem.onerror = () => console.error("Erro ao carregar imagem:", imagem.src);
});

const imagensLixeiras = {
    organico: new Image(),
    papel: new Image(),
    plastico: new Image(),
    vidro: new Image(),
    metal: new Image()
};

imagensLixeiras.organico.src = "../imagens/lixeiras/lixeira_organico_marrom.png";
imagensLixeiras.papel.src = "../imagens/lixeiras/lixeira_papel_azul.png";
imagensLixeiras.plastico.src = "../imagens/lixeiras/lixeira_plastico_vermelha.png";
imagensLixeiras.vidro.src = "../imagens/lixeiras/lixeira_vidro_verde.png";
imagensLixeiras.metal.src = "../imagens/lixeiras/lixeira_metal_amarela.png";

const TAMANHO_LIXO = 80;
const PONTOS_POR_ACERTO = 10;

const lixeiras = [
    { tipo: "organico", x: 800, y: 600, largura: 145, altura: 190 },
    { tipo: "papel", x: 175, y: 600, largura: 145, altura: 190 },
    { tipo: "plastico", x: 330, y: 600, largura: 145, altura: 190 },
    { tipo: "vidro", x: 485, y: 600, largura: 145, altura: 190 },
    { tipo: "metal", x: 640, y: 600, largura: 145, altura: 190 }
];

const dadosLixos = [
    { nome: "Algemas", tipo: "metal", arquivo: "algemas.png" },
    { nome: "Bala", tipo: "plastico", arquivo: "bala.png" },
    { nome: "Caixa de papelão", tipo: "papel", arquivo: "caixa_de_papelao.png" },
    { nome: "Caixa de suco", tipo: "papel", arquivo: "caixa_de_suco.png" },
    { nome: "Caneca quebrada", tipo: "vidro", arquivo: "caneca_quebrada.png" },
    { nome: "Carne", tipo: "organico", arquivo: "carne.png" },
    { nome: "Comida enlatada", tipo: "metal", arquivo: "comida_enlatada.png" },
    { nome: "Copo de café", tipo: "papel", arquivo: "copo_de_cafe.png" },
    { nome: "Coxa de frango", tipo: "organico", arquivo: "coxa_de_frango.png" },
    { nome: "Engrenagem", tipo: "metal", arquivo: "engrenagem.png" },
    { nome: "Fita adesiva", tipo: "plastico", arquivo: "fita_adesiva.png" },
    { nome: "Frasco amarelo", tipo: "vidro", arquivo: "frasco_amarelo.png" },
    { nome: "Frigideira", tipo: "metal", arquivo: "frigideira.png" },
    { nome: "Garrafa amassada", tipo: "plastico", arquivo: "garrafa_amassada.png" },
    { nome: "Garrafa de água", tipo: "plastico", arquivo: "garrafa_de_agua.png" },
    { nome: "Garrafa de cerveja", tipo: "vidro", arquivo: "garrafa_de_cerveja.png" },
    { nome: "Maçã", tipo: "organico", arquivo: "maca.png" },
    { nome: "Maço de cigarro", tipo: "papel", arquivo: "maco_de_cigarro.png" },
    { nome: "Mel engarrafado", tipo: "vidro", arquivo: "mel_engarrafado.png" },
    { nome: "Pão", tipo: "organico", arquivo: "pao.png" },
    { nome: "Poção", tipo: "vidro", arquivo: "pocao.png" },
    { nome: "Recibo", tipo: "papel", arquivo: "recibo.png" },
    { nome: "Saco plástico", tipo: "plastico", arquivo: "saco_plastico.png" },
    { nome: "Sopa de tomate", tipo: "metal", arquivo: "sopa_de_tomate.png" },
    { nome: "Sushi", tipo: "organico", arquivo: "sushi.png" }
];

const listaLixos = dadosLixos.map(lixo => {
    const imagem = new Image();
    imagem.src = "../imagens/lixos/" + lixo.arquivo;

    return {
        ...lixo,
        imagem: imagem
    };
});

let lixoAtual = null;
let filaLixos = [];
let pontuacao = 0;
let vidas = 3;
let jogoEncerrado = false;
let venceu = false;
let partidaIniciada = false;
let jogoPreparado = false;
let tempoRestante = 120;
let cronometroIniciado = false;
let intervaloCronometro = null;

let mouseX = 400;
let mouseY = 250;
let lixeiraHover = null;
let botaoFimHover = null;

const imagensVidas = {
    feliz: new Image(),
    meioMorta: new Image(),
    morta: new Image()
};

imagensVidas.feliz.src = "../imagens/vidas/planta_viva.png";
imagensVidas.meioMorta.src = "../imagens/vidas/planta_meio_morta.png";
imagensVidas.morta.src = "../imagens/vidas/planta_morta.png";

Object.values(imagensVidas).forEach(imagem => {
    imagem.onload = desenharJogo;
    imagem.onerror = () => console.error("Erro ao carregar imagem da vida:", imagem.src);
});

function desenharVidas() {
    let imagem;

    if (vidas === 3) {
        imagem = imagensVidas.feliz;
    } else if (vidas === 2) {
        imagem = imagensVidas.meioMorta;
    } else {
        imagem = imagensVidas.morta;
    }

    if (!imagem.complete || imagem.naturalWidth === 0) {
        return;
    }

    const tamanho = 65;

    const proporcao = Math.min(
        tamanho / imagem.naturalWidth,
        tamanho / imagem.naturalHeight
    );

    const largura = imagem.naturalWidth * proporcao;
    const altura = imagem.naturalHeight * proporcao;

    ctx.drawImage(
        imagem,
        canvas.width - largura - 25,
        15,
        largura,
        altura
    );
}

function desenharPontuacao() {
    ctx.fillStyle = "rgba(98, 122, 94, 0.65)";
    ctx.fillRect(20, 20, 190, 55);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px 'Lilita One', sans-serif";
    ctx.textAlign = "left";

    ctx.fillText("Pontos: " + pontuacao, 35, 55);
}

function desenharCronometro() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;

    const tempoFormatado =
        String(minutos).padStart(2, "0") + ":" +
        String(segundos).padStart(2, "0");

    ctx.fillStyle = "rgba(98, 122, 94, 0.65)";
    ctx.fillRect(230, 20, 170, 55);

    ctx.fillStyle = tempoRestante <= 30 ? "#ff5555" : "#ffffff";
    ctx.font = "24px 'Lilita One', sans-serif";
    ctx.textAlign = "left";

    ctx.fillText("Tempo: " + tempoFormatado, 245, 55);
}

function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

function encerrarJogo(resultado) {
    if (jogoEncerrado) return;

    jogoEncerrado = true;
    venceu = resultado;
    lixoAtual = null;
    botaoFimHover = null;

    clearInterval(intervaloCronometro);

    desenharJogo();

    console.log(venceu ? "Você venceu!" : "Fim de jogo!");
    console.log("Pontuação final: " + pontuacao);
}

function iniciarCronometro() {
    if (cronometroIniciado || jogoEncerrado) return;

    cronometroIniciado = true;

    intervaloCronometro = setInterval(() => {
        if (jogoEncerrado) {
            clearInterval(intervaloCronometro);
            return;
        }

        tempoRestante--;

        if (tempoRestante <= 0) {
            tempoRestante = 0;
            encerrarJogo(false);
            return;
        }

        desenharJogo();
    }, 1000);
}

function proximoLixo() {
    if (jogoEncerrado || !partidaIniciada) return;

    if (filaLixos.length === 0) {
        encerrarJogo(true);
        return;
    }

    lixoAtual = filaLixos.pop();

    iniciarCronometro();

    console.log("Novo objeto: " + lixoAtual.nome);

    desenharJogo();
}

let imagensProcessadas = 0;

function verificarCarregamento() {
    imagensProcessadas++;

    if (imagensProcessadas === listaLixos.length) {
        filaLixos = listaLixos.filter(lixo =>
            lixo.imagem.complete && lixo.imagem.naturalWidth > 0
        );

        embaralhar(filaLixos);

        jogoPreparado = true;

        console.log(
            filaLixos.length + " de " +
            listaLixos.length + " objetos carregados."
        );

        if (partidaIniciada) {
            proximoLixo();
        }
    }
}

listaLixos.forEach(lixo => {
    lixo.imagem.onload = verificarCarregamento;

    lixo.imagem.onerror = () => {
        console.error("Erro ao carregar:", lixo.imagem.src);
        verificarCarregamento();
    };
});

function desenharLixo(imagem, x, y) {
    if (!imagem || !imagem.complete || imagem.naturalWidth === 0) {
        return;
    }

    const proporcao = Math.min(
        TAMANHO_LIXO / imagem.naturalWidth,
        TAMANHO_LIXO / imagem.naturalHeight
    );

    const largura = imagem.naturalWidth * proporcao;
    const altura = imagem.naturalHeight * proporcao;

    ctx.drawImage(
        imagem,
        x - largura / 2,
        y - altura / 2,
        largura,
        altura
    );
}

function desenharLixeiras() {
    lixeiras.forEach(lixeira => {
        const imagem = imagensLixeiras[lixeira.tipo];

        if (imagem.complete && imagem.naturalWidth > 0) {
            const tamanho = lixeiraHover === lixeira ? 1.12 : 1;

            const largura = lixeira.largura * tamanho;
            const altura = lixeira.altura * tamanho;

            const x = lixeira.x - (largura - lixeira.largura) / 2;
            const y = lixeira.y - (altura - lixeira.altura) / 2;

            ctx.drawImage(imagem, x, y, largura, altura);
        }
    });
}

function desenharBotaoFim(x, y, largura, altura, texto, tipo) {
    const hover = botaoFimHover === tipo;
    const posicaoY = hover ? y - 3 : y;

    ctx.save();

    ctx.shadowColor = "#28543a";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = hover ? "#438f45" : "#6dbb59";
    ctx.strokeStyle = "#28543a";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(x, posicaoY, largura, altura, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "30px 'Jersey 15', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(texto, x + largura / 2, posicaoY + altura / 2);

    ctx.restore();
}

function desenharFimDeJogo() {
    const imagemFundo = venceu ? imagensFim.vitoria : imagensFim.derrota;
    const imagemRatinho = venceu ? imagensFim.ratinhoFeliz : imagensFim.ratinhoTriste;

    if (imagemFundo.complete && imagemFundo.naturalWidth > 0) {
        ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (imagemRatinho.complete && imagemRatinho.naturalWidth > 0) {
        const largura = 230;
        const altura = largura * imagemRatinho.naturalHeight / imagemRatinho.naturalWidth;

        ctx.drawImage(
            imagemRatinho,
            canvas.width / 2 - largura / 2,
            170,
            largura,
            altura
        );
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    ctx.font = "58px 'Lilita One', sans-serif";

    ctx.fillText(
        venceu ? "VOCÊ VENCEU!" : "FIM DE JOGO!",
        canvas.width / 2,
        115
    );

    ctx.font = "32px 'Lilita One', sans-serif";

    ctx.fillText(
        venceu ? "Você salvou a cidade!" : "A cidade precisa da sua ajuda!",
        canvas.width / 2,
        500
    );

    ctx.fillText(
        "Pontuação: " + pontuacao,
        canvas.width / 2,
        550
    );

    desenharBotaoFim(275, 625, 285, 75, "JOGAR NOVAMENTE", "jogar");
    desenharBotaoFim(640, 625, 285, 75, "MENU INICIAL", "menu");
}

function desenharJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (fundo.complete && fundo.naturalWidth > 0) {
        ctx.drawImage(fundo, 0, 0, canvas.width, canvas.height);
    }

    desenharLixeiras();
    desenharPontuacao();
    desenharCronometro();
    desenharVidas();

    if (lixoAtual && !jogoEncerrado) {
        desenharLixo(lixoAtual.imagem, mouseX, mouseY);
    }

    if (jogoEncerrado) {
        desenharFimDeJogo();
    }
}

canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();

    mouseX = (event.clientX - rect.left) * canvas.width / rect.width;
    mouseY = (event.clientY - rect.top) * canvas.height / rect.height;

    if (jogoEncerrado) {
        const novoHover =
            mouseX >= 275 && mouseX <= 560 &&
            mouseY >= 622 && mouseY <= 700
                ? "jogar"
                : mouseX >= 640 && mouseX <= 925 &&
                  mouseY >= 622 && mouseY <= 700
                    ? "menu"
                    : null;

        if (novoHover !== botaoFimHover) {
            botaoFimHover = novoHover;
            canvas.style.cursor = novoHover ? "pointer" : "default";
            desenharJogo();
        }

        return;
    }

    if (!partidaIniciada) return;

    const novaLixeiraHover = lixeiras.find(lixeira =>
        mouseX >= lixeira.x &&
        mouseX <= lixeira.x + lixeira.largura &&
        mouseY >= lixeira.y &&
        mouseY <= lixeira.y + lixeira.altura
    ) || null;

    if (novaLixeiraHover !== lixeiraHover) {
        lixeiraHover = novaLixeiraHover;
    }

    canvas.style.cursor = lixeiraHover ? "pointer" : "default";

    desenharJogo();
});

canvas.addEventListener("mouseleave", function() {
    lixeiraHover = null;
    botaoFimHover = null;
    canvas.style.cursor = "default";
    desenharJogo();
});

function prepararNovaPartida() {
    clearInterval(intervaloCronometro);

    pontuacao = 0;
    vidas = 3;
    tempoRestante = 120;
    jogoEncerrado = false;
    venceu = false;
    cronometroIniciado = false;
    lixoAtual = null;
    lixeiraHover = null;
    botaoFimHover = null;

    filaLixos = jogoPreparado
        ? embaralhar(listaLixos.filter(lixo =>
            lixo.imagem.complete && lixo.imagem.naturalWidth > 0
        ))
        : [];
}

function reiniciarJogo() {
    prepararNovaPartida();

    partidaIniciada = true;
    canvas.hidden = false;
    telaInicial.hidden = true;

    iniciarMusica();

    if (jogoPreparado) {
        proximoLixo();
    }

    desenharJogo();
}

function voltarMenu() {
    clearInterval(intervaloCronometro);

    jogoEncerrado = false;
    partidaIniciada = false;
    lixoAtual = null;
    botaoFimHover = null;

    musicaFundo.pause();
    musicaFundo.currentTime = 0;

    canvas.hidden = true;
    telaInicial.hidden = false;
    instrucoes.hidden = true;
}

canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();

    const cliqueX = (event.clientX - rect.left) * canvas.width / rect.width;
    const cliqueY = (event.clientY - rect.top) * canvas.height / rect.height;

    if (jogoEncerrado) {
        if (
            cliqueX >= 275 &&
            cliqueX <= 560 &&
            cliqueY >= 625 &&
            cliqueY <= 700
        ) {
            reiniciarJogo();
            return;
        }

        if (
            cliqueX >= 640 &&
            cliqueX <= 925 &&
            cliqueY >= 625 &&
            cliqueY <= 700
        ) {
            voltarMenu();
            return;
        }

        return;
    }

    if (!partidaIniciada) return;

    const lixeiraClicada = lixeiras.find(lixeira =>
        cliqueX >= lixeira.x &&
        cliqueX <= lixeira.x + lixeira.largura &&
        cliqueY >= lixeira.y &&
        cliqueY <= lixeira.y + lixeira.altura
    );

    if (lixeiraClicada && lixoAtual) {
        tocarSomLixeira();
        verificarResposta(lixeiraClicada.tipo);
    }
});

function verificarResposta(tipoEscolhido) {
    if (!lixoAtual || jogoEncerrado) return;

    if (tipoEscolhido === lixoAtual.tipo) {
        pontuacao += PONTOS_POR_ACERTO;

        console.log("Acertou!");
        console.log(lixoAtual.nome + " foi para a lixeira correta!");
        console.log("Pontuação atual: " + pontuacao);

        lixoAtual = null;

        desenharJogo();

        setTimeout(proximoLixo, 500);
    } else {
        vidas--;

        console.log("Resposta incorreta!");
        console.log("Vidas restantes: " + vidas);

        if (vidas <= 0) {
            vidas = 0;
            encerrarJogo(false);
            return;
        }

        desenharJogo();
    }
}

botaoJogar.addEventListener("click", function() {
    if (partidaIniciada) return;

    prepararNovaPartida();

    partidaIniciada = true;
    telaInicial.hidden = true;
    canvas.hidden = false;

    iniciarMusica();

    if (jogoPreparado) {
        proximoLixo();
    }

    desenharJogo();
});

botaoInstrucoes.addEventListener("click", function() {
    instrucoes.hidden = false;
});

botaoFechar.addEventListener("click", function() {
    instrucoes.hidden = true;
});

fundo.onload = desenharJogo;

fundo.onerror = () => {
    console.error("Não foi possível carregar o fundo.");
};

Object.values(imagensLixeiras).forEach(imagem => {
    imagem.onload = desenharJogo;

    imagem.onerror = () => {
        console.error("Erro ao carregar uma lixeira:", imagem.src);
    };
});

const musicaFundo = new Audio("../musicas/monume-retro-arcade-game-music-577980.mp3");

musicaFundo.loop = true;
musicaFundo.volume = 0.25;
musicaFundo.preload = "auto";

function iniciarMusica() {
    if (!musicaFundo.paused) return;

    musicaFundo.play().catch(erro => {
        console.error("Erro ao iniciar música:", erro);
    });
}

const somLixeira = new Audio("../sons/mocor-os-keypad-sound.mp3");
somLixeira.volume = 0.5;

function tocarSomLixeira() {
    const som = somLixeira.cloneNode();
    som.volume = 0.5;

    som.play().catch(erro => {
        console.error("Erro ao reproduzir som:", erro);
    });
}

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(desenharJogo);
}

desenharJogo();
