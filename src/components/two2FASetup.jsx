import React, { useState, useEffect } from 'react';

function Two2FAsetup({ onSetupComplete})  {
    const [response, setResponse] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        const storedData = sessionStorage.getItem("user");
        if (storedData) {
          console.log(storedData);
          setResponse(JSON.parse(storedData));
          setMessage("Secret copied to clipboard")
        }
      }, []);

    const copyClipBoard = async () => {
        await navigator.clipboard.writeText(response.totp_key);
        setMessage("Secret copied to clipboard")
    }
    return (
        <div>
            <div className="padding">
                <h2 className="test-2xl text-center font-extralight">
                    Turn on 2FA Verification
                </h2>
            </div>
            <hr className="text-gray-200 mt-6 mb-6" />
            <p className="text-center text-gray-600 text-lg font-light pr-6 pl-6">
                Scan the QR code below with your authenticator app
            </p>
            <div className="padding">
                <div className="flex justify-center text-center">
                    {response.totp_key_qr_encoded ? <img src={`data:image/png;base64,${response.totp_key_qr_encoded}`}  alt="2FA QR Code" className="qr-code-image" /> : ("")}
                    <div className="manual-info">
                        <div className="border-separator"></div>
                        <div className="manual-text">
                            QR enter the code manually
                        </div>
                        <div className="border-separator">
                        </div>
                    </div>
                    <div className="margin">
                        {message && <p class="secret-message">{message}</p>}
                        <input readOnly defaultValue="" value={response.totp_key} className="clipboard" onClick={copyClipBoard} />
                    </div>
                </div>
                <button onClick={onSetupComplete} className="twoFA-btn">
                    Continue to Verificiation
                </button>
            </div>
        </div>
    );
};

export default Two2FAsetup;