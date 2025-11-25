import '@/styles/globals.css'
import Head from 'next/head'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo.png" />
      </Head>

      <Component {...pageProps} />
    </>
  )
}
