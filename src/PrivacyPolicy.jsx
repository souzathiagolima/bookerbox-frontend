import React from 'react';

const C = {
  bg: '#132420',
  panel: '#1C332B',
  panelBorder: '#2E4B3E',
  gold: '#C7A25A',
  textLight: '#EFE6D2',
  textMuted: '#9EB2A6',
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
.pp-display { font-family: 'Fraunces', serif; }
.pp-body { font-family: 'Inter', sans-serif; }
`;

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 className="pp-display" style={{ fontSize: 17, fontWeight: 600, color: C.gold, marginBottom: 8 }}>{title}</h2>
      <div className="pp-body" style={{ fontSize: 14.5, lineHeight: 1.7, color: C.textLight, opacity: 0.92 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="pp-body" style={{ minHeight: '100vh', background: C.bg, color: C.textLight, padding: '32px 20px 60px' }}>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <a href="/" style={{ color: C.textMuted, fontSize: 13, textDecoration: 'none' }}>← voltar ao Bookerbox</a>

        <h1 className="pp-display" style={{ fontSize: 26, fontWeight: 700, color: C.textLight, margin: '20px 0 6px' }}>
          Política de Privacidade
        </h1>
        <p className="pp-body" style={{ fontSize: 13, color: C.textMuted, marginBottom: 32 }}>
          Última atualização: agosto de 2026
        </p>

        <Section title="Quem somos">
          <p>
            O Bookerbox é uma rede social para leitores avaliarem livros, organizarem estantes de
            leitura e seguirem outros usuários. Esta página explica quais dados coletamos, por que
            coletamos e como você pode controlá-los.
          </p>
        </Section>

        <Section title="Quais dados coletamos">
          <p>Quando você cria uma conta, coletamos:</p>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Nome e e-mail (informados por você, ou fornecidos pelo Google/Facebook quando você usa login social)</li>
            <li>Senha (armazenada de forma criptografada — nunca em texto puro)</li>
            <li>Livros que você avalia, suas notas, resenhas e estantes de leitura</li>
            <li>Quem você segue e quem te segue</li>
          </ul>
          <p>Não coletamos dados de pagamento, localização ou navegação fora do app.</p>
        </Section>

        <Section title="Login com Google e Facebook">
          <p>
            Se você entrar usando o Google ou o Facebook, recebemos apenas seu nome e e-mail
            (informação básica de identificação), fornecidos diretamente pela Google/Meta com sua
            autorização. Não publicamos nada em seu nome nessas plataformas, nem acessamos amigos,
            fotos ou outros dados do seu perfil social.
          </p>
        </Section>

        <Section title="Como usamos seus dados">
          <p>
            Usamos seus dados exclusivamente para operar o Bookerbox: manter sua conta, exibir suas
            resenhas e estantes, montar seu feed com base em quem você segue, e enviar um e-mail de
            boas-vindas quando você se cadastra. Não vendemos nem compartilhamos seus dados com
            terceiros para fins de publicidade.
          </p>
        </Section>

        <Section title="Serviços de terceiros que usamos">
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Google Books — para buscar informações e capas de livros</li>
            <li>Resend — para enviar o e-mail de boas-vindas</li>
            <li>Render — hospedagem do site e do banco de dados</li>
          </ul>
        </Section>

        <Section title="Seus direitos">
          <p>
            Você pode pedir a exclusão da sua conta e de todos os seus dados a qualquer momento,
            entrando em contato pelo e-mail abaixo. Também pode solicitar uma cópia dos seus dados.
          </p>
        </Section>

        <Section title="Contato">
          <p>
            Dúvidas sobre privacidade? Escreva para <span style={{ color: C.gold }}>contato@bookerbox.app</span>{' '}
            (ou o e-mail que você configurar como responsável pelo app).
          </p>
        </Section>
      </div>
    </div>
  );
}
