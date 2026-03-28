'use client'
import Script from 'next/script'

export default function DonateButton() {
  return (
    <>
      <div
        id="donate-button-global"
        className="flex items-center justify-center"
        style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}
      />
      <Script
        src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).PayPal) {
            (window as any).PayPal.Donation.Button({
              env: 'production',
              hosted_button_id: 'PE6W2EWS2SJFW',
              image: {
                src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_SM.gif',
                alt: 'Donar con el botón PayPal',
                title: 'PayPal - The safer, easier way to pay online!',
              },
            }).render('#donate-button-global')
          }
        }}
      />
    </>
  )
}
