export const ticketTemplate = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>TICKET</title>
    <style>
      * {
        font-size: 12px;
        font-family: 'Times New Roman';
        box-sizing: border-box;
      }

      @media print {
        @page {
          size: 4in 5in;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .oculto-impresion,
        .oculto-impresion * {
          display: none !important;
        }

        .ticket {
          width: 100%;
          max-width: 100%;
          padding: 10mm; /* margen interno para evitar que el contenido toque los bordes */
        }
      }

      td,
      th,
      tr,
      table {
        border-top: 1px solid black;
        border-collapse: collapse;
      }

      tr {
        height: 25px;
      }

      td.title,
      th.title {
        width: 85px;
        max-width: 85px;
        word-break: break-word;
        font-weight: 900;
      }

      td.description,
      th.description {
        width: 285px;
        max-width: 285px;
        word-break: break-word;
      }

      .centrado {
        text-align: center;
        align-content: center;
      }

      .ticket {
        max-width: 400px;
        margin: 0 auto;
        padding: 10mm; /* margen interior en pantalla también */
        border: 1px solid #00000010; /* opcional para ver el borde en pantalla */
      }

      img {
        max-width: 100%;
        margin-bottom: 15px;
      }

      .ticket-logo {
        height: 150px;
        width: 150px;
        object-fit: contain;
      }

      .bn {
        filter: grayscale(100%) contrast(250%) brightness(50%);
      }

      .logo-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .manifest-text {
        font-size: 15px;
        text-align: center;
        margin-bottom: 8px;
      }

      .qr-container {
        margin-top: 10px;
        margin-bottom: 10px;
        text-align: center;
      }

      button {
        margin: 5px;
        padding: 6px 12px;
      }
      .client-name {
           display: -webkit-box;
           -webkit-line-clamp: 2;        /* máximo 2 líneas */
           -webkit-box-orient: vertical;
           overflow: hidden;
           text-align: center;
           font-weight: bold;
           font-size: clamp(14px, 5vw, 28px); /* se adapta al tamaño del contenedor */
           line-height: 1.2;
           max-height: calc(1.2em * 2);  /* 2 líneas de alto */
           margin-bottom: 8px;
      }
    </style>

    <script>
      function imprimir() {
        window.print();
      }
    </script>
  </head>

  <body>
    <div class="ticket">
      <div class="logo-container">
        <img
          class="ticket-logo bn"
          src="https://krediya-bucket.s3.us-east-1.amazonaws.com/logo_happiKidz.png"
          alt="Logotipo"
        />
        <img
          class="ticket-logo"
          src="https://krediya-bucket.s3.us-east-1.amazonaws.com/qr_happikidz.jpg"
          alt="QR"
        />
      </div>

    <span class="client-name">@@clientName</span>

      <table class="tabla">
        <tbody>
          <tr>
            <td class="title">Teléfono:</td>
            <td class="description">@@phone</td>
          </tr>
          <tr>
            <td class="title">Dirección:</td>
            <td class="description">@@address</td>
          </tr>
          <tr>
            <td class="title">Detalle:</td>
            <td class="description">@@details</td>
          </tr>
        </tbody>
      </table>

      <div class="qr-container">
        <svg id="barcode"></svg>
      </div>
            

    </div>

    <div class="centrado oculto-impresion">
      <button onclick="imprimir()">Imprimir ticket</button>
    </div>

    <!-- JsBarcode -->
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.4/dist/barcodes/JsBarcode.code128.min.js"></script>

    <script>
      window.addEventListener('load', function () {
        JsBarcode("#barcode", "@@code", {
          width: 2,
          height: 40
        });
         window.print();
      });
    </script>
  </body>
</html>`
