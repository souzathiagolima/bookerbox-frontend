import React from 'react';

const C = {
  bg: '#132420',
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

const CONTACT_EMAIL = 'thiago@tlscultura.com';

const CONTENT = {
  pt: {
    switchHref: '/privacy',
    switchLabel: 'English version',
    backLabel: '← voltar ao Bookerbox',
    title: 'Política de Privacidade',
    updated: 'Última atualização: agosto de 2026',
    sections: [
      {
        title: 'Quem somos',
        body: (
          <p>
            O Bookerbox é uma rede social para leitores avaliarem livros, organizarem estantes de
            leitura e seguirem outros usuários. Esta página explica quais dados coletamos, por que
            coletamos e como você pode controlá-los, em conformidade com a Lei Geral de Proteção de
            Dados (LGPD — Lei nº 13.709/2018).
          </p>
        ),
      },
      {
        title: 'Quais dados coletamos',
        body: (
          <>
            <p>Quando você cria uma conta, coletamos:</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Nome e e-mail (informados por você, ou fornecidos pelo Google/Facebook quando você usa login social)</li>
              <li>Senha (armazenada de forma criptografada — nunca em texto puro)</li>
              <li>Livros que você avalia, suas notas, resenhas e estantes de leitura</li>
              <li>Quem você segue e quem te segue</li>
            </ul>
            <p>Não coletamos dados de pagamento, geolocalização ou navegação fora do app.</p>
          </>
        ),
      },
      {
        title: 'Login com Google e Facebook',
        body: (
          <p>
            Se você entrar usando o Google ou o Facebook, recebemos apenas seu nome e e-mail
            (informação básica de identificação), fornecidos diretamente pela Google/Meta com sua
            autorização. Não publicamos nada em seu nome nessas plataformas, nem acessamos amigos,
            fotos ou outros dados do seu perfil social.
          </p>
        ),
      },
      {
        title: 'Base legal para o tratamento dos dados',
        body: (
          <p>
            Tratamos seus dados com base no seu <strong>consentimento</strong> (ao criar sua conta) e
            na <strong>execução de contrato</strong> (para prestar o serviço que você contratou ao
            usar o Bookerbox), conforme os incisos I e V do artigo 7º da LGPD.
          </p>
        ),
      },
      {
        title: 'Cookies e armazenamento local',
        body: (
          <>
            <p>
              O Bookerbox <strong>não usa cookies de rastreamento ou de publicidade</strong>, e não
              compartilha dados de navegação com redes de anúncios.
            </p>
            <p>
              Usamos apenas o <em>localStorage</em> do seu navegador — um armazenamento local
              estritamente necessário para manter você conectado entre visitas (guardamos ali um
              token de sessão). Nada nesse armazenamento é enviado a terceiros; ele fica só no seu
              próprio dispositivo e pode ser apagado a qualquer momento limpando os dados do
              navegador ou saindo da sua conta.
            </p>
          </>
        ),
      },
      {
        title: 'Como usamos seus dados',
        body: (
          <p>
            Usamos seus dados exclusivamente para operar o Bookerbox: manter sua conta, exibir suas
            resenhas e estantes, montar seu feed com base em quem você segue, e enviar um e-mail de
            boas-vindas quando você se cadastra. Não vendemos nem compartilhamos seus dados com
            terceiros para fins de publicidade.
          </p>
        ),
      },
      {
        title: 'Por quanto tempo guardamos seus dados',
        body: (
          <p>
            Mantemos seus dados enquanto sua conta existir. Se você solicitar a exclusão da conta,
            removemos seus dados pessoais e de leitura em até 30 dias, exceto quando a lei exigir a
            retenção por período maior.
          </p>
        ),
      },
      {
        title: 'Serviços de terceiros que usamos',
        body: (
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Google Books — para buscar informações e capas de livros</li>
            <li>Resend — para enviar o e-mail de boas-vindas</li>
            <li>Render — hospedagem do site e do banco de dados</li>
          </ul>
        ),
      },
      {
        title: 'Seus direitos (Art. 18 da LGPD)',
        body: (
          <>
            <p>Como titular dos dados, você tem direito a:</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Confirmar se tratamos seus dados, e acessá-los</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portar seus dados a outro fornecedor de serviço</li>
              <li>Eliminar os dados tratados com base no seu consentimento</li>
              <li>Saber com quem compartilhamos seus dados (veja a seção de serviços de terceiros acima)</li>
              <li>Revogar seu consentimento a qualquer momento</li>
            </ul>
            <p>Para exercer qualquer um desses direitos, escreva para o e-mail abaixo.</p>
          </>
        ),
      },
      {
        title: 'Contato',
        body: (
          <p>
            Dúvidas sobre privacidade ou pedidos relacionados aos seus dados? Escreva para{' '}
            <span style={{ color: C.gold }}>{CONTACT_EMAIL}</span>.
          </p>
        ),
      },
    ],
  },
  en: {
    switchHref: '/privacidade',
    switchLabel: 'Versão em português',
    backLabel: '← back to Bookerbox',
    title: 'Privacy Policy',
    updated: 'Last updated: August 2026',
    sections: [
      {
        title: 'Who we are',
        body: (
          <p>
            Bookerbox is a social network for readers to rate books, organize reading shelves, and
            follow other users. This page explains what data we collect, why we collect it, and how
            you can control it, in line with Brazil's General Data Protection Law (LGPD).
          </p>
        ),
      },
      {
        title: 'What data we collect',
        body: (
          <>
            <p>When you create an account, we collect:</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Name and email (entered by you, or provided by Google/Facebook when you use social login)</li>
              <li>Password (stored encrypted — never in plain text)</li>
              <li>Books you review, your ratings, reviews, and reading shelves</li>
              <li>Who you follow and who follows you</li>
            </ul>
            <p>We do not collect payment data, geolocation, or browsing activity outside the app.</p>
          </>
        ),
      },
      {
        title: 'Login with Google and Facebook',
        body: (
          <p>
            If you sign in with Google or Facebook, we only receive your name and email (basic
            identification info), provided directly by Google/Meta with your authorization. We never
            post on your behalf on those platforms, and we don't access friends, photos, or other
            data from your social profile.
          </p>
        ),
      },
      {
        title: 'Legal basis for processing',
        body: (
          <p>
            We process your data based on your <strong>consent</strong> (when you create your
            account) and on <strong>contract performance</strong> (to provide the service you signed
            up for), under items I and V of Article 7 of the LGPD.
          </p>
        ),
      },
      {
        title: 'Cookies and local storage',
        body: (
          <>
            <p>
              Bookerbox <strong>does not use tracking or advertising cookies</strong>, and does not
              share browsing data with ad networks.
            </p>
            <p>
              We only use your browser's <em>localStorage</em> — local storage strictly necessary to
              keep you signed in between visits (we store a session token there). Nothing in this
              storage is sent to third parties; it stays on your own device and can be cleared at any
              time by clearing your browser data or signing out.
            </p>
          </>
        ),
      },
      {
        title: 'How we use your data',
        body: (
          <p>
            We use your data solely to operate Bookerbox: maintaining your account, showing your
            reviews and shelves, building your feed based on who you follow, and sending a welcome
            email when you sign up. We do not sell or share your data with third parties for
            advertising purposes.
          </p>
        ),
      },
      {
        title: 'How long we keep your data',
        body: (
          <p>
            We keep your data for as long as your account exists. If you request account deletion, we
            remove your personal and reading data within 30 days, except where the law requires a
            longer retention period.
          </p>
        ),
      },
      {
        title: 'Third-party services we use',
        body: (
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Google Books — to search for book information and covers</li>
            <li>Resend — to send the welcome email</li>
            <li>Render — website and database hosting</li>
          </ul>
        ),
      },
      {
        title: 'Your rights',
        body: (
          <>
            <p>As the data subject, you have the right to:</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Confirm whether we process your data, and access it</li>
              <li>Correct incomplete, inaccurate, or outdated data</li>
              <li>Request anonymization, blocking, or deletion of unnecessary data</li>
              <li>Port your data to another service provider</li>
              <li>Delete data processed based on your consent</li>
              <li>Know who we share your data with (see the third-party services section above)</li>
              <li>Withdraw your consent at any time</li>
            </ul>
            <p>To exercise any of these rights, write to the email below.</p>
          </>
        ),
      },
      {
        title: 'Contact',
        body: (
          <p>
            Questions about privacy or requests related to your data? Write to{' '}
            <span style={{ color: C.gold }}>{CONTACT_EMAIL}</span>.
          </p>
        ),
      },
    ],
  },
};

export default function PrivacyPolicy({ lang = 'pt' }) {
  const c = CONTENT[lang] || CONTENT.pt;
  return (
    <div className="pp-body" style={{ minHeight: '100vh', background: C.bg, color: C.textLight, padding: '32px 20px 60px' }}>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <a href="/" style={{ color: C.textMuted, fontSize: 13, textDecoration: 'none' }}>{c.backLabel}</a>
          <a href={c.switchHref} style={{ color: C.gold, fontSize: 13, textDecoration: 'underline' }}>{c.switchLabel}</a>
        </div>

        <h1 className="pp-display" style={{ fontSize: 26, fontWeight: 700, color: C.textLight, margin: '20px 0 6px' }}>
          {c.title}
        </h1>
        <p className="pp-body" style={{ fontSize: 13, color: C.textMuted, marginBottom: 32 }}>
          {c.updated}
        </p>

        {c.sections.map((s, i) => (
          <Section key={i} title={s.title}>{s.body}</Section>
        ))}
      </div>
    </div>
  );
}
