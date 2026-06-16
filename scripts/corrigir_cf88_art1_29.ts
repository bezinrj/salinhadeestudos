/**
 * SCRIPT: Corrigir Art. 1º ao 29º da CF/88
 * 
 * O que este script faz:
 * 1. Busca o ID da lei CF/88 na tabela `leis`
 * 2. Apaga todos os artigos de 1 a 29 e seus parágrafos
 * 3. Reinserir cada artigo com caput correto + parágrafos/incisos separados
 * 
 * Como usar no Antigravity:
 * - Cole este arquivo no seu projeto
 * - Certifique-se que o cliente Supabase está importado corretamente
 * - Rode a função principal: corrigirCF88()
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// DADOS COMPLETOS — Art. 1º ao 29º da CF/88 (texto atualizado)
// ============================================================

interface Paragrafo {
  tipo: 'paragrafo' | 'paragrafo_unico' | 'inciso' | 'alinea'
  rotulo: string
  texto: string
  ordem: number
}

interface Artigo {
  numero: string
  rotulo: string
  texto: string // apenas o caput
  ordem: number
  paragrafos: Paragrafo[]
}

const ARTIGOS_CF88: Artigo[] = [
  {
    numero: 'PREAMBULO',
    rotulo: 'PREÂMBULO',
    texto: 'Nós, representantes do povo brasileiro, reunidos em Assembléia Nacional Constituinte para instituir um Estado Democrático, destinado a assegurar o exercício dos direitos sociais e individuais, a liberdade, a segurança, o bem-estar, o desenvolvimento, a igualdade e a justiça como valores supremos de uma sociedade fraterna, pluralista e sem preconceitos, fundada na harmonia social e comprometida, na ordem interna e internacional, com a solução pacífica das controvérsias, promulgamos, sob a proteção de Deus, a seguinte CONSTITUIÇÃO DA REPÚBLICA FEDERATIVA DO BRASIL.',
    ordem: -1,
    paragrafos: []
  },
  {
    numero: 'TITULO_I',
    rotulo: 'TÍTULO I',
    texto: 'Dos Princípios Fundamentais',
    ordem: 0,
    paragrafos: []
  },
  {
    numero: '1',
    rotulo: 'Art. 1º',
    texto: 'A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constitui-se em Estado Democrático de Direito e tem como fundamentos:',
    ordem: 1,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'a soberania;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'a cidadania;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'a dignidade da pessoa humana;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'os valores sociais do trabalho e da livre iniciativa;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'o pluralismo político.', ordem: 5 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição.', ordem: 6 },
    ],
  },
  {
    numero: '2',
    rotulo: 'Art. 2º',
    texto: 'São Poderes da União, independentes e harmônicos entre si, o Legislativo, o Executivo e o Judiciário.',
    ordem: 2,
    paragrafos: [],
  },
  {
    numero: '3',
    rotulo: 'Art. 3º',
    texto: 'Constituem objetivos fundamentais da República Federativa do Brasil:',
    ordem: 3,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'construir uma sociedade livre, justa e solidária;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'garantir o desenvolvimento nacional;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'erradicar a pobreza e a marginalização e reduzir as desigualdades sociais e regionais;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'promover o bem de todos, sem preconceitos de origem, raça, sexo, cor, idade e quaisquer outras formas de discriminação.', ordem: 4 },
    ],
  },
  {
    numero: '4',
    rotulo: 'Art. 4º',
    texto: 'A República Federativa do Brasil rege-se nas suas relações internacionais pelos seguintes princípios:',
    ordem: 4,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'independência nacional;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'prevalência dos direitos humanos;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'autodeterminação dos povos;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'não-intervenção;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'igualdade entre os Estados;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'defesa da paz;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'solução pacífica dos conflitos;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'repúdio ao terrorismo e ao racismo;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'cooperação entre os povos para o progresso da humanidade;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'concessão de asilo político.', ordem: 10 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'A República Federativa do Brasil buscará a integração econômica, política, social e cultural dos povos da América Latina, visando à formação de uma comunidade latino-americana de nações.', ordem: 11 },
    ],
  },
  {
    numero: '5',
    rotulo: 'Art. 5º',
    texto: 'Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes:',
    ordem: 5,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'homens e mulheres são iguais em direitos e obrigações, nos termos desta Constituição;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'ninguém será submetido a tortura nem a tratamento desumano ou degradante;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'é livre a manifestação do pensamento, sendo vedado o anonimato;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'é assegurado o direito de resposta, proporcional ao agravo, além da indenização por dano material, moral ou à imagem;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'é inviolável a liberdade de consciência e de crença, sendo assegurado o livre exercício dos cultos religiosos e garantida, na forma da lei, a proteção aos locais de culto e a suas liturgias;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'é assegurada, nos termos da lei, a prestação de assistência religiosa nas entidades civis e militares de internação coletiva;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'ninguém será privado de direitos por motivo de crença religiosa ou de convicção filosófica ou política, salvo se as invocar para eximir-se de obrigação legal a todos imposta e recusar-se a cumprir prestação alternativa, fixada em lei;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'é livre a expressão da atividade intelectual, artística, científica e de comunicação, independentemente de censura ou licença;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'são invioláveis a intimidade, a vida privada, a honra e a imagem das pessoas, assegurado o direito a indenização pelo dano material ou moral decorrente de sua violação;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'é inviolável o sigilo da correspondência e das comunicações telegráficas, de dados e das comunicações telefônicas, salvo, no último caso, por ordem judicial, nas hipóteses e na forma que a lei estabelecer para fins de investigação criminal ou instrução processual penal;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'é livre o exercício de qualquer trabalho, ofício ou profissão, atendidas as qualificações profissionais que a lei estabelecer;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'é assegurado a todos o acesso à informação e resguardado o sigilo da fonte, quando necessário ao exercício profissional;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'XV', texto: 'é livre a locomoção no território nacional em tempo de paz, podendo qualquer pessoa, nos termos da lei, nele entrar, permanecer ou dele sair com seus bens;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'XVI', texto: 'todos podem reunir-se pacificamente, sem armas, em locais abertos ao público, independentemente de autorização, desde que não frustrem outra reunião anteriormente convocada para o mesmo local, sendo apenas exigido prévio aviso à autoridade competente;', ordem: 16 },
      { tipo: 'inciso', rotulo: 'XVII', texto: 'é plena a liberdade de associação para fins lícitos, vedada a de caráter paramilitar;', ordem: 17 },
      { tipo: 'inciso', rotulo: 'XVIII', texto: 'a criação de associações e, na forma da lei, a de cooperativas independem de autorização, sendo vedada a interferência estatal em seu funcionamento;', ordem: 18 },
      { tipo: 'inciso', rotulo: 'XIX', texto: 'as associações só poderão ser compulsoriamente dissolvidas ou ter suas atividades suspensas por decisão judicial, exigindo-se, no primeiro caso, o trânsito em julgado;', ordem: 19 },
      { tipo: 'inciso', rotulo: 'XX', texto: 'ninguém poderá ser compelido a associar-se ou a permanecer associado;', ordem: 20 },
      { tipo: 'inciso', rotulo: 'XXI', texto: 'as entidades associativas, quando expressamente autorizadas, têm legitimidade para representar seus filiados judicial ou extrajudicialmente;', ordem: 21 },
      { tipo: 'inciso', rotulo: 'XXII', texto: 'é garantido o direito de propriedade;', ordem: 22 },
      { tipo: 'inciso', rotulo: 'XXIII', texto: 'a propriedade atenderá a sua função social;', ordem: 23 },
      { tipo: 'inciso', rotulo: 'XXIV', texto: 'a lei estabelecerá o procedimento para desapropriação por necessidade ou utilidade pública, ou por interesse social, mediante justa e prévia indenização em dinheiro, ressalvados os casos previstos nesta Constituição;', ordem: 24 },
      { tipo: 'inciso', rotulo: 'XXV', texto: 'no caso de iminente perigo público, a autoridade competente poderá usar de propriedade particular, assegurada ao proprietário indenização ulterior, se houver dano;', ordem: 25 },
      { tipo: 'inciso', rotulo: 'XXVI', texto: 'a pequena propriedade rural, assim definida em lei, desde que trabalhada pela família, não será objeto de penhora para pagamento de débitos decorrentes de sua atividade produtiva, dispondo a lei sobre os meios de financiar o seu desenvolvimento;', ordem: 26 },
      { tipo: 'inciso', rotulo: 'XXVII', texto: 'aos autores pertence o direito exclusivo de utilização, publicação ou reprodução de suas obras, transmissível aos herdeiros pelo tempo que a lei fixar;', ordem: 27 },
      { tipo: 'inciso', rotulo: 'XXVIII', texto: 'são assegurados, nos termos da lei:', ordem: 28 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'a proteção às participações individuais em obras coletivas e à reprodução da imagem e voz humanas, inclusive nas atividades desportivas;', ordem: 29 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'o direito de fiscalização do aproveitamento econômico das obras que criarem ou de que participarem aos criadores, aos intérpretes e às respectivas representações sindicais e associativas;', ordem: 30 },
      { tipo: 'inciso', rotulo: 'XXIX', texto: 'a lei assegurará aos autores de inventos industriais privilégio temporário para sua utilização, bem como proteção às criações industriais, à propriedade das marcas, aos nomes de empresas e a outros signos distintivos, tendo em vista o interesse social e o desenvolvimento tecnológico e econômico do País;', ordem: 31 },
      { tipo: 'inciso', rotulo: 'XXX', texto: 'é garantido o direito de herança;', ordem: 32 },
      { tipo: 'inciso', rotulo: 'XXXI', texto: 'a sucessão de bens de estrangeiros situados no País será regulada pela lei brasileira em benefício do cônjuge ou dos filhos brasileiros, sempre que não lhes seja mais favorável a lei pessoal do "de cujus";', ordem: 33 },
      { tipo: 'inciso', rotulo: 'XXXII', texto: 'o Estado promoverá, na forma da lei, a defesa do consumidor;', ordem: 34 },
      { tipo: 'inciso', rotulo: 'XXXIII', texto: 'todos têm direito a receber dos órgãos públicos informações de seu interesse particular, ou de interesse coletivo ou geral, que serão prestadas no prazo da lei, sob pena de responsabilidade, ressalvadas aquelas cujo sigilo seja imprescindível à segurança da sociedade e do Estado;', ordem: 35 },
      { tipo: 'inciso', rotulo: 'XXXIV', texto: 'são a todos assegurados, independentemente do pagamento de taxas:', ordem: 36 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'o direito de petição aos Poderes Públicos em defesa de direitos ou contra ilegalidade ou abuso de poder;', ordem: 37 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'a obtenção de certidões em repartições públicas, para defesa de direitos e esclarecimento de situações de interesse pessoal;', ordem: 38 },
      { tipo: 'inciso', rotulo: 'XXXV', texto: 'a lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito;', ordem: 39 },
      { tipo: 'inciso', rotulo: 'XXXVI', texto: 'a lei não prejudicará o direito adquirido, o ato jurídico perfeito e a coisa julgada;', ordem: 40 },
      { tipo: 'inciso', rotulo: 'XXXVII', texto: 'não haverá juízo ou tribunal de exceção;', ordem: 41 },
      { tipo: 'inciso', rotulo: 'XXXVIII', texto: 'é reconhecida a instituição do júri, com a organização que lhe der a lei, assegurados:', ordem: 42 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'a plenitude de defesa;', ordem: 43 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'o sigilo das votações;', ordem: 44 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'a soberania dos veredictos;', ordem: 45 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'a competência para o julgamento dos crimes dolosos contra a vida;', ordem: 46 },
      { tipo: 'inciso', rotulo: 'XXXIX', texto: 'não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal;', ordem: 47 },
      { tipo: 'inciso', rotulo: 'XL', texto: 'a lei penal não retroagirá, salvo para beneficiar o réu;', ordem: 48 },
      { tipo: 'inciso', rotulo: 'XLI', texto: 'a lei punirá qualquer discriminação atentatória dos direitos e liberdades fundamentais;', ordem: 49 },
      { tipo: 'inciso', rotulo: 'XLII', texto: 'a prática do racismo constitui crime inafiançável e imprescritível, sujeito à pena de reclusão, nos termos da lei;', ordem: 50 },
      { tipo: 'inciso', rotulo: 'XLIII', texto: 'a lei considerará crimes inafiançáveis e insuscetíveis de graça ou anistia a prática da tortura, o tráfico ilícito de entorpecentes e drogas afins, o terrorismo e os definidos como crimes hediondos, por eles respondendo os mandantes, os executores e os que, podendo evitá-los, se omitirem;', ordem: 51 },
      { tipo: 'inciso', rotulo: 'XLIV', texto: 'constitui crime inafiançável e imprescritível a ação de grupos armados, civis ou militares, contra a ordem constitucional e o Estado Democrático;', ordem: 52 },
      { tipo: 'inciso', rotulo: 'XLV', texto: 'nenhuma pena passará da pessoa do condenado, podendo a obrigação de reparar o dano e a decretação do perdimento de bens ser, nos termos da lei, estendidas aos sucessores e contra eles executadas, até o limite do valor do patrimônio transferido;', ordem: 53 },
      { tipo: 'inciso', rotulo: 'XLVI', texto: 'a lei regulará a individualização da pena e adotará, entre outras, as seguintes:', ordem: 54 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'privação ou restrição da liberdade;', ordem: 55 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'perda de bens;', ordem: 56 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'multa;', ordem: 57 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'prestação social alternativa;', ordem: 58 },
      { tipo: 'alinea', rotulo: 'e)', texto: 'suspensão ou interdição de direitos;', ordem: 59 },
      { tipo: 'inciso', rotulo: 'XLVII', texto: 'não haverá penas:', ordem: 60 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'de morte, salvo em caso de guerra declarada, nos termos do art. 84, XIX;', ordem: 61 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'de caráter perpétuo;', ordem: 62 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'de trabalhos forçados;', ordem: 63 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'de banimento;', ordem: 64 },
      { tipo: 'alinea', rotulo: 'e)', texto: 'cruéis;', ordem: 65 },
      { tipo: 'inciso', rotulo: 'XLVIII', texto: 'a pena será cumprida em estabelecimentos distintos, de acordo com a natureza do delito, a idade e o sexo do apenado;', ordem: 66 },
      { tipo: 'inciso', rotulo: 'XLIX', texto: 'é assegurado aos presos o respeito à integridade física e moral;', ordem: 67 },
      { tipo: 'inciso', rotulo: 'L', texto: 'às presidiárias serão asseguradas condições para que possam permanecer com seus filhos durante o período de amamentação;', ordem: 68 },
      { tipo: 'inciso', rotulo: 'LI', texto: 'nenhum brasileiro será extraditado, salvo o naturalizado, em caso de crime comum, praticado antes da naturalização, ou de comprovado envolvimento em tráfico ilícito de entorpecentes e drogas afins, na forma da lei;', ordem: 69 },
      { tipo: 'inciso', rotulo: 'LII', texto: 'não será concedida extradição de estrangeiro por crime político ou de opinião;', ordem: 70 },
      { tipo: 'inciso', rotulo: 'LIII', texto: 'ninguém será processado nem sentenciado senão pela autoridade competente;', ordem: 71 },
      { tipo: 'inciso', rotulo: 'LIV', texto: 'ninguém será privado da liberdade ou de seus bens sem o devido processo legal;', ordem: 72 },
      { tipo: 'inciso', rotulo: 'LV', texto: 'aos litigantes, em processo judicial ou administrativo, e aos acusados em geral são assegurados o contraditório e ampla defesa, com os meios e recursos a ela inerentes;', ordem: 73 },
      { tipo: 'inciso', rotulo: 'LVI', texto: 'são inadmissíveis, no processo, as provas obtidas por meios ilícitos;', ordem: 74 },
      { tipo: 'inciso', rotulo: 'LVII', texto: 'ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória;', ordem: 75 },
      { tipo: 'inciso', rotulo: 'LVIII', texto: 'o civilmente identificado não será submetido a identificação criminal, salvo nas hipóteses previstas em lei;', ordem: 76 },
      { tipo: 'inciso', rotulo: 'LIX', texto: 'será admitida ação privada nos crimes de ação pública, se esta não for intentada no prazo legal;', ordem: 77 },
      { tipo: 'inciso', rotulo: 'LX', texto: 'a lei só poderá restringir a publicidade dos atos processuais quando a defesa da intimidade ou o interesse social o exigirem;', ordem: 78 },
      { tipo: 'inciso', rotulo: 'LXI', texto: 'ninguém será preso senão em flagrante delito ou por ordem escrita e fundamentada de autoridade judiciária competente, salvo nos casos de transgressão militar ou crime propriamente militar, definidos em lei;', ordem: 79 },
      { tipo: 'inciso', rotulo: 'LXII', texto: 'a prisão de qualquer pessoa e o local onde se encontre serão comunicados imediatamente ao juiz competente e à família do preso ou à pessoa por ele indicada;', ordem: 80 },
      { tipo: 'inciso', rotulo: 'LXIII', texto: 'o preso será informado de seus direitos, entre os quais o de permanecer calado, sendo-lhe assegurada a assistência da família e de advogado;', ordem: 81 },
      { tipo: 'inciso', rotulo: 'LXIV', texto: 'o preso tem direito à identificação dos responsáveis por sua prisão ou por seu interrogatório policial;', ordem: 82 },
      { tipo: 'inciso', rotulo: 'LXV', texto: 'a prisão ilegal será imediatamente relaxada pela autoridade judiciária;', ordem: 83 },
      { tipo: 'inciso', rotulo: 'LXVI', texto: 'ninguém será levado à prisão ou nela mantido, quando a lei admitir a liberdade provisória, com ou sem fiança;', ordem: 84 },
      { tipo: 'inciso', rotulo: 'LXVII', texto: 'não haverá prisão civil por dívida, salvo a do responsável pelo inadimplemento voluntário e inescusável de obrigação alimentícia e a do depositário infiel;', ordem: 85 },
      { tipo: 'inciso', rotulo: 'LXVIII', texto: 'conceder-se-á habeas corpus sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder;', ordem: 86 },
      { tipo: 'inciso', rotulo: 'LXIX', texto: 'conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público;', ordem: 87 },
      { tipo: 'inciso', rotulo: 'LXX', texto: 'o mandado de segurança coletivo pode ser impetrado por:', ordem: 88 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'partido político com representação no Congresso Nacional;', ordem: 89 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'organização sindical, entidade de classe ou associação legalmente constituída e em funcionamento há pelo menos um ano, em defesa dos interesses de seus membros ou associados;', ordem: 90 },
      { tipo: 'inciso', rotulo: 'LXXI', texto: 'conceder-se-á mandado de injunção sempre que a falta de norma regulamentadora torne inviável o exercício dos direitos e liberdades constitucionais e das prerrogativas inerentes à nacionalidade, à soberania e à cidadania;', ordem: 91 },
      { tipo: 'inciso', rotulo: 'LXXII', texto: 'conceder-se-á habeas data:', ordem: 92 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'para assegurar o conhecimento de informações relativas à pessoa do impetrante, constantes de registros ou bancos de dados de entidades governamentais ou de caráter público;', ordem: 93 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'para a retificação de dados, quando não se prefira fazê-lo por processo sigiloso, judicial ou administrativo;', ordem: 94 },
      { tipo: 'inciso', rotulo: 'LXXIII', texto: 'qualquer cidadão é parte legítima para propor ação popular que vise a anular ato lesivo ao patrimônio público ou de entidade de que o Estado participe, à moralidade administrativa, ao meio ambiente e ao patrimônio histórico e cultural, ficando o autor, salvo comprovada má-fé, isento de custas judiciais e do ônus da sucumbência;', ordem: 95 },
      { tipo: 'inciso', rotulo: 'LXXIV', texto: 'o Estado prestará assistência jurídica integral e gratuita aos que comprovarem insuficiência de recursos;', ordem: 96 },
      { tipo: 'inciso', rotulo: 'LXXV', texto: 'o Estado indenizará o condenado por erro judiciário, assim como o que ficar preso além do tempo fixado na sentença;', ordem: 97 },
      { tipo: 'inciso', rotulo: 'LXXVI', texto: 'são gratuitos para os reconhecidamente pobres, na forma da lei:', ordem: 98 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'o registro civil de nascimento;', ordem: 99 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'a certidão de óbito;', ordem: 100 },
      { tipo: 'inciso', rotulo: 'LXXVII', texto: 'são gratuitas as ações de habeas corpus e habeas data, e, na forma da lei, os atos necessários ao exercício da cidadania.', ordem: 101 },
      { tipo: 'inciso', rotulo: 'LXXVIII', texto: 'a todos, no âmbito judicial e administrativo, são assegurados a razoável duração do processo e os meios que garantam a celeridade de sua tramitação.', ordem: 102 },
      { tipo: 'inciso', rotulo: 'LXXIX', texto: 'é assegurado, nos termos da lei, o direito à proteção dos dados pessoais, inclusive nos meios digitais.', ordem: 103 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata.', ordem: 104 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os direitos e garantias expressos nesta Constituição não excluem outros decorrentes do regime e dos princípios por ela adotados, ou dos tratados internacionais em que a República Federativa do Brasil seja parte.', ordem: 105 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Os tratados e convenções internacionais sobre direitos humanos que forem aprovados, em cada Casa do Congresso Nacional, em dois turnos, por três quintos dos votos dos respectivos membros, serão equivalentes às emendas constitucionais.', ordem: 106 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'O Brasil se submete à jurisdição de Tribunal Penal Internacional a cuja criação tenha manifestado adesão.', ordem: 107 },
    ],
  },
  {
    numero: '6',
    rotulo: 'Art. 6º',
    texto: 'São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição.',
    ordem: 6,
    paragrafos: [
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'Todo brasileiro em situação de vulnerabilidade social terá direito a uma renda básica familiar, garantida pelo poder público em programa permanente de transferência de renda, cujas normas e requisitos de acesso serão determinados em lei, observada a legislação fiscal e orçamentária.', ordem: 1 },
    ],
  },
  {
    numero: '7',
    rotulo: 'Art. 7º',
    texto: 'São direitos dos trabalhadores urbanos e rurais, além de outros que visem à melhoria de sua condição social:',
    ordem: 7,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'relação de emprego protegida contra despedida arbitrária ou sem justa causa, nos termos de lei complementar, que preverá indenização compensatória, dentre outros direitos;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'seguro-desemprego, em caso de desemprego involuntário;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'fundo de garantia do tempo de serviço;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'salário mínimo, fixado em lei, nacionalmente unificado, capaz de atender a suas necessidades vitais básicas e às de sua família com moradia, alimentação, educação, saúde, lazer, vestuário, higiene, transporte e previdência social, com reajustes periódicos que lhe preservem o poder aquisitivo, sendo vedada sua vinculação para qualquer fim;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'piso salarial proporcional à extensão e à complexidade do trabalho;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'irredutibilidade do salário, salvo o disposto em convenção ou acordo coletivo;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'garantia de salário, nunca inferior ao mínimo, para os que percebem remuneração variável;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'décimo terceiro salário com base na remuneração integral ou no valor da aposentadoria;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'remuneração do trabalho noturno superior à do diurno;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'proteção do salário na forma da lei, constituindo crime sua retenção dolosa;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'participação nos lucros, ou resultados, desvinculada da remuneração, e, excepcionalmente, participação na gestão da empresa, conforme definido em lei;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'salário-família pago em razão do dependente do trabalhador de baixa renda nos termos da lei;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'duração do trabalho normal não superior a oito horas diárias e quarenta e quatro semanais, facultada a compensação de horários e a redução da jornada, mediante acordo ou convenção coletiva de trabalho;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'jornada de seis horas para o trabalho realizado em turnos ininterruptos de revezamento, salvo negociação coletiva;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'XV', texto: 'repouso semanal remunerado, preferencialmente aos domingos;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'XVI', texto: 'remuneração do serviço extraordinário superior, no mínimo, em cinquenta por cento à do normal;', ordem: 16 },
      { tipo: 'inciso', rotulo: 'XVII', texto: 'gozo de férias anuais remuneradas com, pelo menos, um terço a mais do que o salário normal;', ordem: 17 },
      { tipo: 'inciso', rotulo: 'XVIII', texto: 'licença à gestante, sem prejuízo do emprego e do salário, com a duração de cento e vinte dias;', ordem: 18 },
      { tipo: 'inciso', rotulo: 'XIX', texto: 'licença-paternidade, nos termos fixados em lei;', ordem: 19 },
      { tipo: 'inciso', rotulo: 'XX', texto: 'proteção do mercado de trabalho da mulher, mediante incentivos específicos, nos termos da lei;', ordem: 20 },
      { tipo: 'inciso', rotulo: 'XXI', texto: 'aviso prévio proporcional ao tempo de serviço, sendo no mínimo de trinta dias, nos termos da lei;', ordem: 21 },
      { tipo: 'inciso', rotulo: 'XXII', texto: 'redução dos riscos inerentes ao trabalho, por meio de normas de saúde, higiene e segurança;', ordem: 22 },
      { tipo: 'inciso', rotulo: 'XXIII', texto: 'adicional de remuneração para as atividades penosas, insalubres ou perigosas, na forma da lei;', ordem: 23 },
      { tipo: 'inciso', rotulo: 'XXIV', texto: 'aposentadoria;', ordem: 24 },
      { tipo: 'inciso', rotulo: 'XXV', texto: 'assistência gratuita aos filhos e dependentes desde o nascimento até 5 (cinco) anos de idade em creches e pré-escolas;', ordem: 25 },
      { tipo: 'inciso', rotulo: 'XXVI', texto: 'reconhecimento das convenções e acordos coletivos de trabalho;', ordem: 26 },
      { tipo: 'inciso', rotulo: 'XXVII', texto: 'proteção em face da automação, na forma da lei;', ordem: 27 },
      { tipo: 'inciso', rotulo: 'XXVIII', texto: 'seguro contra acidentes de trabalho, a cargo do empregador, sem excluir a indenização a que este está obrigado, quando incorrer em dolo ou culpa;', ordem: 28 },
      { tipo: 'inciso', rotulo: 'XXIX', texto: 'ação, quanto aos créditos resultantes das relações de trabalho, com prazo prescricional de cinco anos para os trabalhadores urbanos e rurais, até o limite de dois anos após a extinção do contrato de trabalho;', ordem: 29 },
      { tipo: 'inciso', rotulo: 'XXX', texto: 'proibição de diferença de salários, de exercício de funções e de critério de admissão por motivo de sexo, idade, cor ou estado civil;', ordem: 30 },
      { tipo: 'inciso', rotulo: 'XXXI', texto: 'proibição de qualquer discriminação no tocante a salário e critérios de admissão do trabalhador portador de deficiência;', ordem: 31 },
      { tipo: 'inciso', rotulo: 'XXXII', texto: 'proibição de distinção entre trabalho manual, técnico e intelectual ou entre os profissionais respectivos;', ordem: 32 },
      { tipo: 'inciso', rotulo: 'XXXIII', texto: 'proibição de trabalho noturno, perigoso ou insalubre a menores de dezoito e de qualquer trabalho a menores de dezesseis anos, salvo na condição de aprendiz, a partir de quatorze anos;', ordem: 33 },
      { tipo: 'inciso', rotulo: 'XXXIV', texto: 'igualdade de direitos entre o trabalhador com vínculo empregatício permanente e o trabalhador avulso.', ordem: 34 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'São assegurados à categoria dos trabalhadores domésticos os direitos previstos nos incisos IV, VI, VII, VIII, X, XIII, XV, XVI, XVII, XVIII, XIX, XXI, XXII, XXIV, XXVI, XXX, XXXI e XXXIII e, atendidas as condições estabelecidas em lei e observada a simplificação do cumprimento das obrigações tributárias, principais e acessórias, decorrentes da relação de trabalho e suas peculiaridades, os previstos nos incisos I, II, III, IX, XII, XXV e XXVIII, bem como a sua integração à previdência social.', ordem: 35 },
    ],
  },
  {
    numero: '8',
    rotulo: 'Art. 8º',
    texto: 'É livre a associação profissional ou sindical, observado o seguinte:',
    ordem: 8,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'a lei não poderá exigir autorização do Estado para a fundação de sindicato, ressalvado o registro no órgão competente, vedadas ao Poder Público a interferência e a intervenção na organização sindical;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'é vedada a criação de mais de uma organização sindical, em qualquer grau, representativa de categoria profissional ou econômica, na mesma base territorial, que será definida pelos trabalhadores ou empregadores interessados, não podendo ser inferior à área de um Município;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'ao sindicato cabe a defesa dos direitos e interesses coletivos ou individuais da categoria, inclusive em questões judiciais ou administrativas;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'a assembleia geral fixará a contribuição que, em se tratando de categoria profissional, será descontada em folha, para custeio do sistema confederativo da representação sindical respectiva, independentemente da contribuição prevista em lei;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'ninguém será obrigado a filiar-se ou a manter-se filiado a sindicato;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'é obrigatória a participação dos sindicatos nas negociações coletivas de trabalho;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'o aposentado filiado tem direito a votar e ser votado nas organizações sindicais;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'é vedada a dispensa do empregado sindicalizado a partir do registro da candidatura a cargo de direção ou representação sindical e, se eleito, ainda que suplente, até um ano após o final do mandato, salvo se cometer falta grave nos termos da lei.', ordem: 8 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'As disposições deste artigo aplicam-se à organização de sindicatos rurais e de colônias de pescadores, atendidas as condições que a lei estabelecer.', ordem: 9 },
    ],
  },
  {
    numero: '9',
    rotulo: 'Art. 9º',
    texto: 'É assegurado o direito de greve, competindo aos trabalhadores decidir sobre a oportunidade de exercê-lo e sobre os interesses que devam por meio dele defender.',
    ordem: 9,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'A lei definirá os serviços ou atividades essenciais e disporá sobre o atendimento das necessidades inadiáveis da comunidade.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os abusos cometidos sujeitam os responsáveis às penas da lei.', ordem: 2 },
    ],
  },
  {
    numero: '10',
    rotulo: 'Art. 10',
    texto: 'É assegurada a participação dos trabalhadores e empregadores nos colegiados dos órgãos públicos em que seus interesses profissionais ou previdenciários sejam objeto de discussão e deliberação.',
    ordem: 10,
    paragrafos: [],
  },
  {
    numero: '11',
    rotulo: 'Art. 11',
    texto: 'Nas empresas de mais de duzentos empregados, é assegurada a eleição de um representante destes com a finalidade exclusiva de promover-lhes o entendimento direto com os empregadores.',
    ordem: 11,
    paragrafos: [],
  },
  {
    numero: '12',
    rotulo: 'Art. 12',
    texto: 'São brasileiros:',
    ordem: 12,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'natos:', ordem: 1 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'os nascidos na República Federativa do Brasil, ainda que de pais estrangeiros, desde que estes não estejam a serviço de seu país;', ordem: 2 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'os nascidos no estrangeiro, de pai brasileiro ou mãe brasileira, desde que qualquer deles esteja a serviço da República Federativa do Brasil;', ordem: 3 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'os nascidos no estrangeiro de pai brasileiro ou de mãe brasileira, desde que sejam registrados em repartição brasileira competente ou venham a residir na República Federativa do Brasil e optem, em qualquer tempo, depois de atingida a maioridade, pela nacionalidade brasileira;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'II', texto: 'naturalizados:', ordem: 5 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'os que, na forma da lei, adquiram a nacionalidade brasileira, exigidas aos originários de países de língua portuguesa apenas residência por um ano ininterrupto e idoneidade moral;', ordem: 6 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'os estrangeiros de qualquer nacionalidade, residentes na República Federativa do Brasil há mais de quinze anos ininterruptos e sem condenação penal, desde que requeiram a nacionalidade brasileira.', ordem: 7 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'Aos portugueses com residência permanente no País, se houver reciprocidade em favor de brasileiros, serão atribuídos os direitos inerentes ao brasileiro, salvo os casos previstos nesta Constituição.', ordem: 8 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'A lei não poderá estabelecer distinção entre brasileiros natos e naturalizados, salvo nos casos previstos nesta Constituição.', ordem: 9 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'São privativos de brasileiro nato os cargos:', ordem: 10 },
      { tipo: 'inciso', rotulo: 'I', texto: 'de Presidente e Vice-Presidente da República;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'II', texto: 'de Presidente da Câmara dos Deputados;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'III', texto: 'de Presidente do Senado Federal;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'de Ministro do Supremo Tribunal Federal;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'V', texto: 'da carreira diplomática;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'de oficial das Forças Armadas.', ordem: 16 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'de Ministro de Estado da Defesa.', ordem: 17 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'Será declarada a perda da nacionalidade do brasileiro que:', ordem: 18 },
      { tipo: 'inciso', rotulo: 'I', texto: 'tiver cancelada sua naturalização, por sentença judicial, em virtude de fraude relacionada ao processo de naturalização ou de atentado contra a ordem constitucional e o Estado Democrático;', ordem: 19 },
      { tipo: 'inciso', rotulo: 'II', texto: 'fizer pedido expresso de perda da nacionalidade brasileira perante autoridade brasileira competente, ressalvadas situações que acarretem apatridia.', ordem: 20 },
      { tipo: 'paragrafo', rotulo: '§ 5º', texto: 'A renúncia da nacionalidade, nos termos do inciso II do § 4º deste artigo, não impede o interessado de readquirir sua nacionalidade brasileira originária, nos termos da lei.', ordem: 21 },
    ],
  },
  {
    numero: '13',
    rotulo: 'Art. 13',
    texto: 'A língua portuguesa é o idioma oficial da República Federativa do Brasil.',
    ordem: 13,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'São símbolos da República Federativa do Brasil a bandeira, o hino, as armas e o selo nacionais.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os Estados, o Distrito Federal e os Municípios poderão ter símbolos próprios.', ordem: 2 },
    ],
  },
  {
    numero: '14',
    rotulo: 'Art. 14',
    texto: 'A soberania popular será exercida pelo sufrágio universal e pelo voto direto e secreto, com valor igual para todos, e, nos termos da lei, mediante:',
    ordem: 14,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'plebiscito;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'referendo;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'iniciativa popular.', ordem: 3 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'O alistamento eleitoral e o voto são:', ordem: 4 },
      { tipo: 'inciso', rotulo: 'I', texto: 'obrigatórios para os maiores de dezoito anos;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'II', texto: 'facultativos para:', ordem: 6 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'os analfabetos;', ordem: 7 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'os maiores de setenta anos;', ordem: 8 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'os maiores de dezesseis e menores de dezoito anos.', ordem: 9 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Não podem alistar-se como eleitores os estrangeiros e, durante o período do serviço militar obrigatório, os conscritos.', ordem: 10 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'São condições de elegibilidade, na forma da lei:', ordem: 11 },
      { tipo: 'inciso', rotulo: 'I', texto: 'a nacionalidade brasileira;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'II', texto: 'o pleno exercício dos direitos políticos;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'III', texto: 'o alistamento eleitoral;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'o domicílio eleitoral na circunscrição;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'V', texto: 'a filiação partidária;', ordem: 16 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'a idade mínima de:', ordem: 17 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'trinta e cinco anos para Presidente e Vice-Presidente da República e Senador;', ordem: 18 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'trinta anos para Governador e Vice-Governador de Estado e do Distrito Federal;', ordem: 19 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'vinte e um anos para Deputado Federal, Deputado Estadual ou Distrital, Prefeito, Vice-Prefeito e juiz de paz;', ordem: 20 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'dezoito anos para Vereador.', ordem: 21 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'São inelegíveis os inalistáveis e os analfabetos.', ordem: 22 },
      { tipo: 'paragrafo', rotulo: '§ 5º', texto: 'O Presidente da República, os Governadores de Estado e do Distrito Federal, os Prefeitos e quem os houver sucedido, ou substituído no curso dos mandatos poderão ser reeleitos para um único período subsequente.', ordem: 23 },
      { tipo: 'paragrafo', rotulo: '§ 6º', texto: 'Para concorrerem a outros cargos, o Presidente da República, os Governadores de Estado e do Distrito Federal e os Prefeitos devem renunciar aos respectivos mandatos até seis meses antes do pleito.', ordem: 24 },
      { tipo: 'paragrafo', rotulo: '§ 7º', texto: 'São inelegíveis, no território de jurisdição do titular, o cônjuge e os parentes consanguíneos ou afins, até o segundo grau ou por adoção, do Presidente da República, de Governador de Estado ou Território, do Distrito Federal, de Prefeito ou de quem os haja substituído dentro dos seis meses anteriores ao pleito, salvo se já titular de mandato eletivo e candidato à reeleição.', ordem: 25 },
      { tipo: 'paragrafo', rotulo: '§ 8º', texto: 'O militar alistável é elegível, atendidas as seguintes condições:', ordem: 26 },
      { tipo: 'inciso', rotulo: 'I', texto: 'se contar menos de dez anos de serviço, deverá afastar-se da atividade;', ordem: 27 },
      { tipo: 'inciso', rotulo: 'II', texto: 'se contar mais de dez anos de serviço, será agregado pela autoridade superior e, se eleito, passará automaticamente, no ato da diplomação, para a inatividade.', ordem: 28 },
      { tipo: 'paragrafo', rotulo: '§ 9º', texto: 'Lei complementar estabelecerá outros casos de inelegibilidade e os prazos de sua cessação, a fim de proteger a probidade administrativa, a moralidade para exercício de mandato considerada vida pregressa do candidato, e a normalidade e legitimidade das eleições contra a influência do poder econômico ou o abuso do exercício de função, cargo ou emprego na administração direta ou indireta.', ordem: 29 },
      { tipo: 'paragrafo', rotulo: '§ 10', texto: 'O mandato eletivo poderá ser impugnado ante a Justiça Eleitoral no prazo de quinze dias contados da diplomação, instruída a ação com provas de abuso do poder econômico, corrupção ou fraude.', ordem: 30 },
      { tipo: 'paragrafo', rotulo: '§ 11', texto: 'A ação de impugnação de mandato tramitará em segredo de justiça, respondendo o autor, na forma da lei, se temerária ou de manifesta má-fé.', ordem: 31 },
      { tipo: 'paragrafo', rotulo: '§ 12', texto: 'Serão realizadas concomitantemente às eleições municipais as consultas populares sobre questões locais aprovadas pelas Câmaras Municipais e encaminhadas à Justiça Eleitoral até 90 (noventa) dias antes da data das eleições, observados os limites operacionais relativos ao número de quesitos.', ordem: 32 },
      { tipo: 'paragrafo', rotulo: '§ 13', texto: 'As manifestações favoráveis e contrárias às questões submetidas às consultas populares nos termos do § 12 ocorrerão durante as campanhas eleitorais, sem a utilização de propaganda gratuita no rádio e na televisão.', ordem: 33 },
    ],
  },
  {
    numero: '15',
    rotulo: 'Art. 15',
    texto: 'É vedada a cassação de direitos políticos, cuja perda ou suspensão só se dará nos casos de:',
    ordem: 15,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'cancelamento da naturalização por sentença transitada em julgado;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'incapacidade civil absoluta;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'condenação criminal transitada em julgado, enquanto durarem seus efeitos;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'recusa de cumprir obrigação a todos imposta ou prestação alternativa, nos termos do art. 5º, VIII;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'improbidade administrativa, nos termos do art. 37, § 4º.', ordem: 5 },
    ],
  },
  {
    numero: '16',
    rotulo: 'Art. 16',
    texto: 'A lei que alterar o processo eleitoral entrará em vigor na data de sua publicação, não se aplicando à eleição que ocorra até um ano da data de sua vigência.',
    ordem: 16,
    paragrafos: [],
  },
  {
    numero: '17',
    rotulo: 'Art. 17',
    texto: 'É livre a criação, fusão, incorporação e extinção de partidos políticos, resguardados a soberania nacional, o regime democrático, o pluripartidarismo, os direitos fundamentais da pessoa humana e observados os seguintes preceitos:',
    ordem: 17,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'caráter nacional;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'proibição de recebimento de recursos financeiros de entidade ou governo estrangeiros ou de subordinação a estes;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'prestação de contas à Justiça Eleitoral;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'funcionamento parlamentar de acordo com a lei.', ordem: 4 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'É assegurada aos partidos políticos autonomia para definir sua estrutura interna e estabelecer regras sobre escolha, formação e duração de seus órgãos permanentes e provisórios e sobre sua organização e funcionamento e para adotar os critérios de escolha e o regime de suas coligações nas eleições majoritárias, vedada a sua celebração nas eleições proporcionais, sem obrigatoriedade de vinculação entre as candidaturas em âmbito nacional, estadual, distrital ou municipal, devendo seus estatutos estabelecer normas de disciplina e fidelidade partidária.', ordem: 5 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os partidos políticos, após adquirirem personalidade jurídica, na forma da lei civil, registrarão seus estatutos no Tribunal Superior Eleitoral.', ordem: 6 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Somente terão direito a recursos do fundo partidário e acesso gratuito ao rádio e à televisão, na forma da lei, os partidos políticos que alternativamente:', ordem: 7 },
      { tipo: 'inciso', rotulo: 'I', texto: 'obtiverem, nas eleições para a Câmara dos Deputados, no mínimo, 3% (três por cento) dos votos válidos, distribuídos em pelo menos um terço das unidades da Federação, com um mínimo de 2% (dois por cento) dos votos válidos em cada uma delas; ou', ordem: 8 },
      { tipo: 'inciso', rotulo: 'II', texto: 'tiverem elegido pelo menos quinze Deputados Federais distribuídos em pelo menos um terço das unidades da Federação.', ordem: 9 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'É vedada a utilização pelos partidos políticos de organização paramilitar.', ordem: 10 },
      { tipo: 'paragrafo', rotulo: '§ 5º', texto: 'Ao eleito por partido que não preencher os requisitos previstos no § 3º deste artigo é assegurado o mandato e facultada a filiação, sem perda do mandato, a outro partido que os tenha atingido, não sendo essa filiação considerada para fins de distribuição dos recursos do fundo partidário e de acesso gratuito ao tempo de rádio e de televisão.', ordem: 11 },
      { tipo: 'paragrafo', rotulo: '§ 6º', texto: 'Os Deputados Federais, os Deputados Estaduais, os Deputados Distritais e os Vereadores que se desligarem do partido pelo qual tenham sido eleitos perderão o mandato, salvo nos casos de anuência do partido ou de outras hipóteses de justa causa estabelecidas em lei, não computada, em qualquer caso, a migração de partido para fins de distribuição de recursos do fundo partidário ou de outros fundos públicos e de acesso gratuito ao rádio e à televisão.', ordem: 12 },
      { tipo: 'paragrafo', rotulo: '§ 7º', texto: 'Os partidos políticos devem aplicar no mínimo 5% (cinco por cento) dos recursos do fundo partidário na criação e na manutenção de programas de promoção e difusão da participação política das mulheres, de acordo com os interesses intrapartidários.', ordem: 13 },
      { tipo: 'paragrafo', rotulo: '§ 8º', texto: 'O montante do Fundo Especial de Financiamento de Campanha e da parcela do fundo partidário destinada a campanhas eleitorais, bem como o tempo de propaganda gratuita no rádio e na televisão a ser distribuído pelos partidos às respectivas candidatas, deverão ser de no mínimo 30% (trinta por cento), proporcional ao número de candidatas, e a distribuição deverá ser realizada conforme critérios definidos pelos respectivos órgãos de direção e pelas normas estatutárias, considerados a autonomia e o interesse partidário.', ordem: 14 },
      { tipo: 'paragrafo', rotulo: '§ 9º', texto: 'Dos recursos oriundos do Fundo Especial de Financiamento de Campanha e do fundo partidário destinados às campanhas eleitorais, os partidos políticos devem, obrigatoriamente, aplicar 30% (trinta por cento) em candidaturas de pessoas pretas e pardas, nas circunscrições que melhor atendam aos interesses e às estratégias partidárias.', ordem: 15 },
    ],
  },
  {
    numero: '18',
    rotulo: 'Art. 18',
    texto: 'A organização político-administrativa da República Federativa do Brasil compreende a União, os Estados, o Distrito Federal e os Municípios, todos autônomos, nos termos desta Constituição.',
    ordem: 18,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'Brasília é a Capital Federal.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os Territórios Federais integram a União, e sua criação, transformação em Estado ou reintegração ao Estado de origem serão reguladas em lei complementar.', ordem: 2 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Os Estados podem incorporar-se entre si, subdividir-se ou desmembrar-se para se anexarem a outros, ou formarem novos Estados ou Territórios Federais, mediante aprovação da população diretamente interessada, através de plebiscito, e do Congresso Nacional, por lei complementar.', ordem: 3 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'A criação, a incorporação, a fusão e o desmembramento de Municípios, far-se-ão por lei estadual, dentro do período determinado por Lei Complementar Federal, e dependerão de consulta prévia, mediante plebiscito, às populações dos Municípios envolvidos, após divulgação dos Estudos de Viabilidade Municipal, apresentados e publicados na forma da lei.', ordem: 4 },
    ],
  },
  {
    numero: '19',
    rotulo: 'Art. 19',
    texto: 'É vedado à União, aos Estados, ao Distrito Federal e aos Municípios:',
    ordem: 19,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'estabelecer cultos religiosos ou igrejas, subvencioná-los, embaraçar-lhes o funcionamento ou manter com eles ou seus representantes relações de dependência ou aliança, ressalvada, na forma da lei, a colaboração de interesse público;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'recusar fé aos documentos públicos;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'criar distinções entre brasileiros ou preferências entre si.', ordem: 3 },
    ],
  },
  {
    numero: '20',
    rotulo: 'Art. 20',
    texto: 'São bens da União:',
    ordem: 20,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'os que atualmente lhe pertencem e os que lhe vierem a ser atribuídos;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'as terras devolutas indispensáveis à defesa das fronteiras, das fortificações e construções militares, das vias federais de comunicação e à preservação ambiental, definidas em lei;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'os lagos, rios e quaisquer correntes de água em terrenos de seu domínio, ou que banhem mais de um Estado, sirvam de limites com outros países, ou se estendam a território estrangeiro ou dele provenham, bem como os terrenos marginais e as praias fluviais;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'as ilhas fluviais e lacustres nas zonas limítrofes com outros países; as praias marítimas; as ilhas oceânicas e as costeiras, excluídas, destas, as que contenham a sede de Municípios, exceto aquelas áreas afetadas ao serviço público e a unidade ambiental federal, e as referidas no art. 26, II;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'os recursos naturais da plataforma continental e da zona econômica exclusiva;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'o mar territorial;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'os terrenos de marinha e seus acrescidos;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'os potenciais de energia hidráulica;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'os recursos minerais, inclusive os do subsolo;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'as cavidades naturais subterrâneas e os sítios arqueológicos e pré-históricos;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'as terras tradicionalmente ocupadas pelos índios.', ordem: 11 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'É assegurada, nos termos da lei, aos Estados, ao Distrito Federal e aos Municípios, bem como a órgãos da administração direta da União, participação no resultado da exploração de petróleo ou gás natural, de recursos hídricos para fins de geração de energia elétrica e de outros recursos minerais no respectivo território, plataforma continental, mar territorial ou zona econômica exclusiva, ou compensação financeira por essa exploração.', ordem: 12 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'A faixa de até cento e cinquenta quilômetros de largura, ao longo das fronteiras terrestres, designada como faixa de fronteira, é considerada fundamental para defesa do território nacional, e sua ocupação e utilização serão reguladas em lei.', ordem: 13 },
    ],
  },
  {
    numero: '21',
    rotulo: 'Art. 21',
    texto: 'Compete à União:',
    ordem: 21,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'manter relações com Estados estrangeiros e participar de organizações internacionais;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'declarar a guerra e celebrar a paz;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'assegurar a defesa nacional;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'permitir, nos casos previstos em lei complementar, que forças estrangeiras transitem pelo território nacional ou nele permaneçam temporariamente;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'decretar o estado de sítio, o estado de defesa e a intervenção federal;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'autorizar e fiscalizar a produção e o comércio de material bélico;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'emitir moeda;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'administrar as reservas cambiais do País e fiscalizar as operações de natureza financeira, especialmente as de crédito, câmbio e capitalização, bem como as de seguros e de previdência privada;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'elaborar e executar planos nacionais e regionais de ordenação do território e de desenvolvimento econômico e social;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'manter o serviço postal e o correio aéreo nacional;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'explorar, diretamente ou mediante autorização, concessão ou permissão, os serviços de telecomunicações, nos termos da lei, que disporá sobre a organização dos serviços, a criação de um órgão regulador e outros aspectos institucionais;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'explorar, diretamente ou mediante autorização, concessão ou permissão:', ordem: 12 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'os serviços de radiodifusão sonora e de sons e imagens;', ordem: 13 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'os serviços e instalações de energia elétrica e o aproveitamento energético dos cursos de água, em articulação com os Estados onde se situam os potenciais hidroenergéticos;', ordem: 14 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'a navegação aérea, aeroespacial e a infraestrutura aeroportuária;', ordem: 15 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'os serviços de transporte ferroviário e aquaviário entre portos brasileiros e fronteiras nacionais, ou que transponham os limites de Estado ou Território;', ordem: 16 },
      { tipo: 'alinea', rotulo: 'e)', texto: 'os serviços de transporte rodoviário interestadual e internacional de passageiros;', ordem: 17 },
      { tipo: 'alinea', rotulo: 'f)', texto: 'os portos marítimos, fluviais e lacustres;', ordem: 18 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'organizar e manter o Poder Judiciário, o Ministério Público do Distrito Federal e dos Territórios e a Defensoria Pública dos Territórios;', ordem: 19 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'organizar e manter a polícia civil, a polícia penal, a polícia militar e o corpo de bombeiros militar do Distrito Federal, bem como prestar assistência financeira ao Distrito Federal para a execução de serviços públicos, por meio de fundo próprio;', ordem: 20 },
      { tipo: 'inciso', rotulo: 'XV', texto: 'organizar e manter os serviços oficiais de estatística, geografia, geologia e cartografia de âmbito nacional;', ordem: 21 },
      { tipo: 'inciso', rotulo: 'XVI', texto: 'exercer a classificação, para efeito indicativo, de diversões públicas e de programas de rádio e televisão;', ordem: 22 },
      { tipo: 'inciso', rotulo: 'XVII', texto: 'conceder anistia;', ordem: 23 },
      { tipo: 'inciso', rotulo: 'XVIII', texto: 'planejar e promover a defesa permanente contra as calamidades públicas, especialmente as secas e as inundações;', ordem: 24 },
      { tipo: 'inciso', rotulo: 'XIX', texto: 'instituir sistema nacional de gerenciamento de recursos hídricos e definir critérios de outorga de direitos de seu uso;', ordem: 25 },
      { tipo: 'inciso', rotulo: 'XX', texto: 'instituir diretrizes para o desenvolvimento urbano, inclusive habitação, saneamento básico e transportes urbanos;', ordem: 26 },
      { tipo: 'inciso', rotulo: 'XXI', texto: 'estabelecer princípios e diretrizes para o sistema nacional de viação;', ordem: 27 },
      { tipo: 'inciso', rotulo: 'XXII', texto: 'executar os serviços de polícia marítima, aeroportuária e de fronteiras;', ordem: 28 },
      { tipo: 'inciso', rotulo: 'XXIII', texto: 'explorar os serviços e instalações nucleares de qualquer natureza e exercer monopólio estatal sobre a pesquisa, a lavra, o enriquecimento e reprocessamento, a industrialização e o comércio de minérios nucleares e seus derivados, atendidos os seguintes princípios e condições:', ordem: 29 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'toda atividade nuclear em território nacional somente será admitida para fins pacíficos e mediante aprovação do Congresso Nacional;', ordem: 30 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'sob regime de permissão, são autorizadas a comercialização e a utilização de radioisótopos para a pesquisa e usos médicos, agrícolas e industriais;', ordem: 31 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'sob regime de permissão, são autorizadas a produção, comercialização e utilização de radioisótopos de meia-vida igual ou inferior a duas horas;', ordem: 32 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'a responsabilidade civil por danos nucleares independe da existência de culpa;', ordem: 33 },
      { tipo: 'inciso', rotulo: 'XXIV', texto: 'organizar, manter e executar a inspeção do trabalho;', ordem: 34 },
      { tipo: 'inciso', rotulo: 'XXV', texto: 'estabelecer as áreas e as condições para o exercício da atividade de garimpagem, em forma associativa.', ordem: 35 },
    ],
  },
  {
    numero: '22',
    rotulo: 'Art. 22',
    texto: 'Compete privativamente à União legislar sobre:',
    ordem: 22,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'direito civil, comercial, penal, processual, eleitoral, agrário, marítimo, aeronáutico, espacial e do trabalho;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'desapropriação;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'requisições civis e militares, em caso de iminente perigo e em tempo de guerra;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'águas, energia, informática, telecomunicações e radiodifusão;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'serviço postal;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'sistema monetário e de medidas, títulos e garantias dos metais;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'política de crédito, câmbio, seguros e transferência de valores;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'comércio exterior e interestadual;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'diretrizes da política nacional de transportes;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'regime dos portos, navegação lacustre, fluvial, marítima, aérea e aeroespacial;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'trânsito e transporte;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'jazidas, minas, outros recursos minerais e metalurgia;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'nacionalidade, cidadania e naturalização;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'populações indígenas;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'XV', texto: 'emigração e imigração, entrada, extradição e expulsão de estrangeiros;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'XVI', texto: 'organização do sistema nacional de emprego e condições para o exercício de profissões;', ordem: 16 },
      { tipo: 'inciso', rotulo: 'XVII', texto: 'organização judiciária, do Ministério Público do Distrito Federal e dos Territórios e da Defensoria Pública dos Territórios, bem como organização administrativa destes;', ordem: 17 },
      { tipo: 'inciso', rotulo: 'XVIII', texto: 'sistema estatístico, sistema cartográfico e de geologia nacionais;', ordem: 18 },
      { tipo: 'inciso', rotulo: 'XIX', texto: 'sistemas de poupança, captação e garantia da poupança popular;', ordem: 19 },
      { tipo: 'inciso', rotulo: 'XX', texto: 'sistemas de consórcios e sorteios;', ordem: 20 },
      { tipo: 'inciso', rotulo: 'XXI', texto: 'normas gerais de organização, efetivos, material bélico, garantias, convocação, mobilização, inatividades e pensões das polícias militares e dos corpos de bombeiros militares;', ordem: 21 },
      { tipo: 'inciso', rotulo: 'XXII', texto: 'competência da polícia federal e das polícias rodoviária e ferroviária federais;', ordem: 22 },
      { tipo: 'inciso', rotulo: 'XXIII', texto: 'seguridade social;', ordem: 23 },
      { tipo: 'inciso', rotulo: 'XXIV', texto: 'diretrizes e bases da educação nacional;', ordem: 24 },
      { tipo: 'inciso', rotulo: 'XXV', texto: 'registros públicos;', ordem: 25 },
      { tipo: 'inciso', rotulo: 'XXVI', texto: 'atividades nucleares de qualquer natureza;', ordem: 26 },
      { tipo: 'inciso', rotulo: 'XXVII', texto: 'normas gerais de licitação e contratação, em todas as modalidades, para as administrações públicas diretas, autárquicas e fundacionais da União, Estados, Distrito Federal e Municípios, obedecido o disposto no art. 37, XXI, e para as empresas públicas e sociedades de economia mista, nos termos do art. 173, § 1°, III;', ordem: 27 },
      { tipo: 'inciso', rotulo: 'XXVIII', texto: 'defesa territorial, defesa aeroespacial, defesa marítima, defesa civil e mobilização nacional;', ordem: 28 },
      { tipo: 'inciso', rotulo: 'XXIX', texto: 'propaganda comercial.', ordem: 29 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'Lei complementar poderá autorizar os Estados a legislar sobre questões específicas das matérias relacionadas neste artigo.', ordem: 30 },
    ],
  },
  {
    numero: '23',
    rotulo: 'Art. 23',
    texto: 'É competência comum da União, dos Estados, do Distrito Federal e dos Municípios:',
    ordem: 23,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'zelar pela guarda da Constituição, das leis e das instituições democráticas e conservar o patrimônio público;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'cuidar da saúde e assistência pública, da proteção e garantia das pessoas portadoras de deficiência;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'proteger os documentos, as obras e outros bens de valor histórico, artístico e cultural, os monumentos, as paisagens naturais notáveis e os sítios arqueológicos;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'impedir a evasão, a destruição e a descaracterização de obras de arte e de outros bens de valor histórico, artístico ou cultural;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'proporcionar os meios de acesso à cultura, à educação, à ciência, à tecnologia, à pesquisa e à inovação;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'proteger o meio ambiente e combater a poluição em qualquer de suas formas;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'preservar as florestas, a fauna e a flora;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'fomentar a produção agropecuária e organizar o abastecimento alimentar;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'promover programas de construção de moradias e a melhoria das condições habitacionais e de saneamento básico;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'combater as causas da pobreza e os fatores de marginalização, promovendo a integração social dos setores desfavorecidos;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'registrar, acompanhar e fiscalizar as concessões de direitos de pesquisa e exploração de recursos hídricos e minerais em seus territórios;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'estabelecer e implantar política de educação para a segurança do trânsito.', ordem: 12 },
      { tipo: 'paragrafo_unico', rotulo: 'Parágrafo único.', texto: 'Leis complementares fixarão normas para a cooperação entre a União e os Estados, o Distrito Federal e os Municípios, tendo em vista o equilíbrio do desenvolvimento e do bem-estar em âmbito nacional.', ordem: 13 },
    ],
  },
  {
    numero: '24',
    rotulo: 'Art. 24',
    texto: 'Compete à União, aos Estados e ao Distrito Federal legislar concorrentemente sobre:',
    ordem: 24,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'direito tributário, financeiro, penitenciário, econômico e urbanístico;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'orçamento;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'juntas comerciais;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'custas dos serviços forenses;', ordem: 4 },
      { tipo: 'inciso', rotulo: 'V', texto: 'produção e consumo;', ordem: 5 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'florestas, caça, pesca, fauna, conservação da natureza, defesa do solo e dos recursos naturais, proteção do meio ambiente e controle da poluição;', ordem: 6 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'proteção ao patrimônio histórico, cultural, artístico, turístico e paisagístico;', ordem: 7 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'responsabilidade por dano ao meio ambiente, ao consumidor, a bens e direitos de valor artístico, estético, histórico, turístico e paisagístico;', ordem: 8 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'educação, cultura, ensino, desporto, ciência, tecnologia, pesquisa, desenvolvimento e inovação;', ordem: 9 },
      { tipo: 'inciso', rotulo: 'X', texto: 'criação, funcionamento e processo do juizado de pequenas causas;', ordem: 10 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'procedimentos em matéria processual;', ordem: 11 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'previdência social, proteção e defesa da saúde;', ordem: 12 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'assistência jurídica e Defensoria pública;', ordem: 13 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'proteção e integração social das pessoas portadoras de deficiência;', ordem: 14 },
      { tipo: 'inciso', rotulo: 'XV', texto: 'proteção à infância e à juventude;', ordem: 15 },
      { tipo: 'inciso', rotulo: 'XVI', texto: 'organização, garantias, direitos e deveres das polícias civis.', ordem: 16 },
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'No âmbito da legislação concorrente, a competência da União limitar-se-á a estabelecer normas gerais.', ordem: 17 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'A competência da União para legislar sobre normas gerais não exclui a competência suplementar dos Estados.', ordem: 18 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Inexistindo lei federal sobre normas gerais, os Estados exercerão a competência legislativa plena, para atender a suas peculiaridades.', ordem: 19 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'A superveniência de lei federal sobre normas gerais suspende a eficácia da lei estadual, no que lhe for contrário.', ordem: 20 },
    ],
  },
  {
    numero: '25',
    rotulo: 'Art. 25',
    texto: 'Os Estados organizam-se e regem-se pelas Constituições e leis que adotarem, observados os princípios desta Constituição.',
    ordem: 25,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'São reservadas aos Estados as competências que não lhes sejam vedadas por esta Constituição.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Cabe aos Estados explorar diretamente, ou mediante concessão, os serviços locais de gás canalizado, na forma da lei, vedada a edição de medida provisória para a sua regulamentação.', ordem: 2 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Os Estados poderão, mediante lei complementar, instituir regiões metropolitanas, aglomerações urbanas e microrregiões, constituídas por agrupamentos de municípios limítrofes, para integrar a organização, o planejamento e a execução de funções públicas de interesse comum.', ordem: 3 },
    ],
  },
  {
    numero: '26',
    rotulo: 'Art. 26',
    texto: 'Incluem-se entre os bens dos Estados:',
    ordem: 26,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'as águas superficiais ou subterrâneas, fluentes, emergentes e em depósito, ressalvadas, neste caso, na forma da lei, as decorrentes de obras da União;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'as áreas, nas ilhas oceânicas e costeiras, que estiverem no seu domínio, excluídas aquelas sob domínio da União, Municípios ou terceiros;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'as ilhas fluviais e lacustres não pertencentes à União;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'as terras devolutas não compreendidas entre as da União.', ordem: 4 },
    ],
  },
  {
    numero: '27',
    rotulo: 'Art. 27',
    texto: 'O número de Deputados à Assembleia Legislativa corresponderá ao triplo da representação do Estado na Câmara dos Deputados e, atingido o número de trinta e seis, será acrescido de tantos quantos forem os Deputados Federais acima de doze.',
    ordem: 27,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'Será de quatro anos o mandato dos Deputados Estaduais, aplicando-se-lhes as regras desta Constituição sobre sistema eleitoral, inviolabilidade, imunidades, remuneração, perda de mandato, licença, impedimentos e incorporação às Forças Armadas.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'O subsídio dos Deputados Estaduais será fixado por lei de iniciativa da Assembleia Legislativa, na razão de, no máximo, setenta e cinco por cento daquele estabelecido, em espécie, para os Deputados Federais, observado o que dispõem os arts. 39, § 4º, 57, § 7º, 150, II, 153, III, e 153, § 2º, I.', ordem: 2 },
      { tipo: 'paragrafo', rotulo: '§ 3º', texto: 'Compete às Assembleias Legislativas dispor sobre seu regimento interno, polícia e serviços administrativos de sua secretaria, e prover os respectivos cargos.', ordem: 3 },
      { tipo: 'paragrafo', rotulo: '§ 4º', texto: 'A lei disporá sobre a iniciativa popular no processo legislativo estadual.', ordem: 4 },
    ],
  },
  {
    numero: '28',
    rotulo: 'Art. 28',
    texto: 'A eleição do Governador e do Vice-Governador de Estado, para mandato de quatro anos, realizar-se-á no primeiro domingo de outubro, em primeiro turno, e no último domingo de outubro, em segundo turno, se houver, do ano anterior ao do término do mandato de seus antecessores, e a posse ocorrerá em primeiro de janeiro do ano subsequente, observado, quanto ao mais, o disposto no art. 77.',
    ordem: 28,
    paragrafos: [
      { tipo: 'paragrafo', rotulo: '§ 1º', texto: 'Perderá o mandato o Governador que assumir outro cargo ou função na administração pública direta ou indireta, ressalvada a posse em virtude de concurso público e observado o disposto no art. 38, I, IV e V.', ordem: 1 },
      { tipo: 'paragrafo', rotulo: '§ 2º', texto: 'Os subsídios do Governador, do Vice-Governador e dos Secretários de Estado serão fixados por lei de iniciativa da Assembleia Legislativa, observado o que dispõem os arts. 37, XI, 39, § 4º, 150, II, 153, III, e 153, § 2º, I.', ordem: 2 },
    ],
  },
  {
    numero: '29',
    rotulo: 'Art. 29',
    texto: 'O Município reger-se-á por lei orgânica, votada em dois turnos, com o interstício mínimo de dez dias, e aprovada por dois terços dos membros da Câmara Municipal, que a promulgará, atendidos os princípios estabelecidos nesta Constituição, na Constituição do respectivo Estado e os seguintes preceitos:',
    ordem: 29,
    paragrafos: [
      { tipo: 'inciso', rotulo: 'I', texto: 'eleição do Prefeito e do Vice-Prefeito realizada no primeiro domingo de outubro do ano anterior ao término do mandato dos que devam suceder, aplicadas as regras do art. 77, no caso de Municípios com mais de duzentos mil eleitores;', ordem: 1 },
      { tipo: 'inciso', rotulo: 'II', texto: 'eleição do Prefeito e do Vice-Prefeito até noventa dias antes do término do mandato dos que devam suceder, aplicadas as regras do art. 77 no caso de Municípios com mais de duzentos mil eleitores;', ordem: 2 },
      { tipo: 'inciso', rotulo: 'III', texto: 'posse do Prefeito e do Vice-Prefeito no dia 1º de janeiro do ano subsequente ao da eleição;', ordem: 3 },
      { tipo: 'inciso', rotulo: 'IV', texto: 'para a composição das Câmaras Municipais, será observado o limite máximo de:', ordem: 4 },
      { tipo: 'alinea', rotulo: 'a)', texto: '9 (nove) Vereadores, nos Municípios de até 15.000 (quinze mil) habitantes;', ordem: 5 },
      { tipo: 'alinea', rotulo: 'b)', texto: '11 (onze) Vereadores, nos Municípios de mais de 15.000 (quinze mil) habitantes e de até 30.000 (trinta mil) habitantes;', ordem: 6 },
      { tipo: 'alinea', rotulo: 'c)', texto: '13 (treze) Vereadores, nos Municípios com mais de 30.000 (trinta mil) e de até 50.000 (cinquenta mil) habitantes;', ordem: 7 },
      { tipo: 'alinea', rotulo: 'd)', texto: '15 (quinze) Vereadores, nos Municípios de mais de 50.000 (cinquenta mil) habitantes e de até 80.000 (oitenta mil) habitantes;', ordem: 8 },
      { tipo: 'alinea', rotulo: 'e)', texto: '17 (dezessete) Vereadores, nos Municípios de mais de 80.000 (oitenta mil) habitantes e de até 120.000 (cento e vinte mil) habitantes;', ordem: 9 },
      { tipo: 'alinea', rotulo: 'f)', texto: '19 (dezenove) Vereadores, nos Municípios de mais de 120.000 (cento e vinte mil) habitantes e de até 160.000 (cento e sessenta mil) habitantes;', ordem: 10 },
      { tipo: 'alinea', rotulo: 'g)', texto: '21 (vinte e um) Vereadores, nos Municípios de mais de 160.000 (cento e sessenta mil) habitantes e de até 300.000 (trezentos mil) habitantes;', ordem: 11 },
      { tipo: 'alinea', rotulo: 'h)', texto: '23 (vinte e três) Vereadores, nos Municípios de mais de 300.000 (trezentos mil) habitantes e de até 450.000 (quatrocentos e cinquenta mil) habitantes;', ordem: 12 },
      { tipo: 'alinea', rotulo: 'i)', texto: '25 (vinte e cinco) Vereadores, nos Municípios de mais de 450.000 (quatrocentos e cinquenta mil) habitantes e de até 600.000 (seiscentos mil) habitantes;', ordem: 13 },
      { tipo: 'alinea', rotulo: 'j)', texto: '27 (vinte e sete) Vereadores, nos Municípios de mais de 600.000 (seiscentos mil) habitantes e de até 750.000 (setecentos e cinquenta mil) habitantes;', ordem: 14 },
      { tipo: 'alinea', rotulo: 'k)', texto: '29 (vinte e nove) Vereadores, nos Municípios de mais de 750.000 (setecentos e cinquenta mil) habitantes e de até 900.000 (novecentos mil) habitantes;', ordem: 15 },
      { tipo: 'alinea', rotulo: 'l)', texto: '31 (trinta e um) Vereadores, nos Municípios de mais de 900.000 (novecentos mil) habitantes e de até 1.050.000 (um milhão e cinquenta mil) habitantes;', ordem: 16 },
      { tipo: 'alinea', rotulo: 'm)', texto: '33 (trinta e três) Vereadores, nos Municípios de mais de 1.050.000 (um milhão e cinquenta mil) habitantes e de até 1.200.000 (um milhão e duzentos mil) habitantes;', ordem: 17 },
      { tipo: 'alinea', rotulo: 'n)', texto: '35 (trinta e cinco) Vereadores, nos Municípios de mais de 1.200.000 (um milhão e duzentos mil) habitantes e de até 1.350.000 (um milhão trezentos e cinquenta mil) habitantes;', ordem: 18 },
      { tipo: 'alinea', rotulo: 'o)', texto: '37 (trinta e sete) Vereadores, nos Municípios de mais de 1.350.000 (um milhão e trezentos e cinquenta mil) habitantes e de até 1.500.000 (um milhão e quinhentos mil) habitantes;', ordem: 19 },
      { tipo: 'alinea', rotulo: 'p)', texto: '39 (trinta e nove) Vereadores, nos Municípios de mais de 1.500.000 (um milhão e quinhentos mil) habitantes e de até 1.800.000 (um milhão e oitocentos mil) habitantes;', ordem: 20 },
      { tipo: 'alinea', rotulo: 'q)', texto: '41 (quarenta e um) Vereadores, nos Municípios de mais de 1.800.000 (um milhão e oitocentos mil) habitantes e de até 2.400.000 (dois milhões e quatrocentos mil) habitantes;', ordem: 21 },
      { tipo: 'alinea', rotulo: 'r)', texto: '43 (quarenta e três) Vereadores, nos Municípios de mais de 2.400.000 (dois milhões e quatrocentos mil) habitantes e de até 3.000.000 (três milhões) de habitantes;', ordem: 22 },
      { tipo: 'alinea', rotulo: 's)', texto: '45 (quarenta e cinco) Vereadores, nos Municípios de mais de 3.000.000 (três milhões) de habitantes e de até 4.000.000 (quatro milhões) de habitantes;', ordem: 23 },
      { tipo: 'alinea', rotulo: 't)', texto: '47 (quarenta e sete) Vereadores, nos Municípios de mais de 4.000.000 (quatro milhões) de habitantes e de até 5.000.000 (cinco milhões) de habitantes;', ordem: 24 },
      { tipo: 'alinea', rotulo: 'u)', texto: '49 (quarenta e nove) Vereadores, nos Municípios de mais de 5.000.000 (cinco milhões) de habitantes e de até 6.000.000 (seis milhões) de habitantes;', ordem: 25 },
      { tipo: 'alinea', rotulo: 'v)', texto: '51 (cinquenta e um) Vereadores, nos Municípios de mais de 6.000.000 (seis milhões) de habitantes e de até 7.000.000 (sete milhões) de habitantes;', ordem: 26 },
      { tipo: 'alinea', rotulo: 'w)', texto: '53 (cinquenta e três) Vereadores, nos Municípios de mais de 7.000.000 (sete milhões) de habitantes e de até 8.000.000 (oito milhões) de habitantes; e', ordem: 27 },
      { tipo: 'alinea', rotulo: 'x)', texto: '55 (cinquenta e cinco) Vereadores, nos Municípios de mais de 8.000.000 (oito milhões) de habitantes;', ordem: 28 },
      { tipo: 'inciso', rotulo: 'V', texto: 'subsídios do Prefeito, do Vice-Prefeito e dos Secretários Municipais fixados por lei de iniciativa da Câmara Municipal, observado o que dispõem os arts. 37, XI, 39, § 4º, 150, II, 153, III, e 153, § 2º, I;', ordem: 29 },
      { tipo: 'inciso', rotulo: 'VI', texto: 'o subsídio dos Vereadores será fixado pelas respectivas Câmaras Municipais em cada legislatura para a subsequente, observado o que dispõe esta Constituição, observados os critérios estabelecidos na respectiva Lei Orgânica e os seguintes limites máximos:', ordem: 30 },
      { tipo: 'alinea', rotulo: 'a)', texto: 'em Municípios de até dez mil habitantes, o subsídio máximo dos Vereadores corresponderá a vinte por cento do subsídio dos Deputados Estaduais;', ordem: 31 },
      { tipo: 'alinea', rotulo: 'b)', texto: 'em Municípios de dez mil e um a cinquenta mil habitantes, o subsídio máximo dos Vereadores corresponderá a trinta por cento do subsídio dos Deputados Estaduais;', ordem: 32 },
      { tipo: 'alinea', rotulo: 'c)', texto: 'em Municípios de cinquenta mil e um a cem mil habitantes, o subsídio máximo dos Vereadores corresponderá a quarenta por cento do subsídio dos Deputados Estaduais;', ordem: 33 },
      { tipo: 'alinea', rotulo: 'd)', texto: 'em Municípios de cem mil e um a trezentos mil habitantes, o subsídio máximo dos Vereadores corresponderá a cinquenta por cento do subsídio dos Deputados Estaduais;', ordem: 34 },
      { tipo: 'alinea', rotulo: 'e)', texto: 'em Municípios de trezentos mil e um a quinhentos mil habitantes, o subsídio máximo dos Vereadores corresponderá a sessenta por cento do subsídio dos Deputados Estaduais;', ordem: 35 },
      { tipo: 'alinea', rotulo: 'f)', texto: 'em Municípios de mais de quinhentos mil habitantes, o subsídio máximo dos Vereadores corresponderá a setenta e cinco por cento do subsídio dos Deputados Estaduais;', ordem: 36 },
      { tipo: 'inciso', rotulo: 'VII', texto: 'o total da despesa com a remuneração dos Vereadores não poderá ultrapassar o montante de cinco por cento da receita do Município;', ordem: 37 },
      { tipo: 'inciso', rotulo: 'VIII', texto: 'inviolabilidade dos Vereadores por suas opiniões, palavras e votos no exercício do mandato e na circunscrição do Município;', ordem: 38 },
      { tipo: 'inciso', rotulo: 'IX', texto: 'proibições e incompatibilidades, no exercício da vereança, similares, no que couber, ao disposto nesta Constituição para os membros do Congresso Nacional e na Constituição do respectivo Estado para os membros da Assembleia Legislativa;', ordem: 39 },
      { tipo: 'inciso', rotulo: 'X', texto: 'julgamento do Prefeito perante o Tribunal de Justiça;', ordem: 40 },
      { tipo: 'inciso', rotulo: 'XI', texto: 'organização das funções legislativas e fiscalizadoras da Câmara Municipal;', ordem: 41 },
      { tipo: 'inciso', rotulo: 'XII', texto: 'cooperação das associações representativas no planejamento municipal;', ordem: 42 },
      { tipo: 'inciso', rotulo: 'XIII', texto: 'iniciativa popular de projetos de lei de interesse específico do Município, da cidade ou de bairros, através de manifestação de, pelo menos, cinco por cento do eleitorado;', ordem: 43 },
      { tipo: 'inciso', rotulo: 'XIV', texto: 'perda do mandato do Prefeito, nos termos do art. 28, parágrafo único.', ordem: 44 },
    ],
  },
]

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

export async function corrigirCF88() {
  // 0. Autenticar como admin
  console.log('🔐 Autenticando...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'vneto2023@gmail.com',
    password: 'Vneto8349',
  })
  if (authError) {
    console.error('❌ Erro ao autenticar:', authError.message)
    return
  }
  console.log('✅ Autenticado com sucesso!')

  console.log('🔍 Buscando ID da lei CF/88...')

  // 1. Busca o ID da CF/88
  const { data: leis, error: leiError } = await supabase
    .from('vm_leis')
    .select('id, nome, sigla')
    .or('sigla.ilike.CF/88,sigla.ilike.CF88,nome.ilike.%Constituição Federal%')
    .limit(5)

  if (leiError) {
    console.error('❌ Erro ao buscar lei:', leiError)
    return
  }

  if (!leis || leis.length === 0) {
    console.log('ℹ️  Lei CF/88 não encontrada. Criando automaticamente...')
    const { data: novaLei, error: insertError } = await supabase
      .from('vm_leis')
      .insert({
        nome: 'Constituição Federal de 1988',
        sigla: 'CF/88',
        descricao: 'Constituição da República Federativa do Brasil de 1988',
        categoria: 'Constituição',
        ordem: 1,
        publicada: true,
      })
      .select('id, nome, sigla')
      .single()

    if (insertError || !novaLei) {
      console.error('❌ Erro ao criar lei CF/88:', insertError)
      return
    }
    leis.push(novaLei)
    console.log(`✅ Lei CF/88 criada com ID: ${novaLei.id}`)
  }

  console.log('📋 Leis encontradas:', leis)
  const lei = leis[0]
  console.log(`✅ Usando lei: "${lei.nome}" (ID: ${lei.id})`)

  // 2. Busca artigos de 1 a 29 desta lei
  console.log('\n🗑️  Apagando artigos antigos (1–29) e seus parágrafos achatados...')

  const numerosParaDeletar: string[] = []
  for (const artigo of ARTIGOS_CF88) {
    numerosParaDeletar.push(artigo.numero)
    for (const p of artigo.paragrafos) {
      numerosParaDeletar.push(`${artigo.numero}_${p.rotulo}`)
    }
  }

  const { data: artigosExistentes } = await supabase
    .from('vm_artigos')
    .select('id, numero')
    .eq('lei_id', lei.id)
    .in('numero', numerosParaDeletar)

  if (artigosExistentes && artigosExistentes.length > 0) {
    const ids = artigosExistentes.map(a => a.id)
    // Deleting from vm_artigos will cascade to vm_paragrafos
    const { error: delArt } = await supabase
      .from('vm_artigos')
      .delete()
      .in('id', ids)

    if (delArt) console.error('Erro ao deletar artigos:', delArt)
    else console.log(`✅ ${ids.length} artigos antigos removidos`)
  } else {
    console.log('ℹ️  Nenhum artigo antigo encontrado para deletar.')
  }

  // 3. Reinsere de forma hierárquica (artigo principal em vm_artigos, subitens em vm_paragrafos)
  console.log('\n📥 Inserindo artigos e parágrafos de forma hierárquica...')
  let totalArtigosInseridos = 0
  let totalParagrafosInseridos = 0
  let ordemArtigo = 1

  for (const artigo of ARTIGOS_CF88) {
    // Insere o Caput / Preâmbulo / Título
    const { data: artData, error: artError } = await supabase
      .from('vm_artigos')
      .insert({
        lei_id: lei.id,
        numero: artigo.numero,
        rotulo: artigo.rotulo,
        texto: artigo.texto,
        ordem: ordemArtigo++,
      })
      .select('id')
      .single()

    if (artError || !artData) {
      console.error(`❌ Erro ao inserir ${artigo.rotulo}:`, artError)
      continue
    }
    totalArtigosInseridos++

    // Insere os parágrafos/incisos/alíneas em vm_paragrafos
    if (artigo.paragrafos && artigo.paragrafos.length > 0) {
      let ordemParagrafo = 1
      const paragrafosPayload = artigo.paragrafos.map((p: any) => ({
        artigo_id: artData.id,
        tipo: p.tipo,
        rotulo: p.rotulo,
        texto: p.texto,
        ordem: ordemParagrafo++,
      }))

      const { error: pError } = await supabase
        .from('vm_paragrafos')
        .insert(paragrafosPayload)

      if (pError) {
        console.error(`❌ Erro ao inserir parágrafos do ${artigo.rotulo}:`, pError)
      } else {
        totalParagrafosInseridos += paragrafosPayload.length
      }
    }

    console.log(`✅ ${artigo.rotulo} processado (${artigo.paragrafos.length} subitens)`)
  }

  console.log('\n🎉 Concluído!')
  console.log(`📊 Resumo: ${totalArtigosInseridos} artigos e ${totalParagrafosInseridos} parágrafos/incisos inseridos.`)
}

// Chame assim no seu arquivo principal:
corrigirCF88()
