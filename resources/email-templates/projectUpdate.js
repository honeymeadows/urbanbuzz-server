export const projectUpdate = ({ project }) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
<html dir="ltr" lang="en">
  <head></head>
  <div
    style="
      display: none;
      overflow: hidden;
      line-height: 1px;
      opacity: 0;
      max-height: 0;
      max-width: 0;
    "
  >
    Project Update
    <div></div>
  </div>

  <body
    style="
      margin-left: auto;
      margin-right: auto;
      margin-top: auto;
      margin-bottom: auto;
      background-color: rgb(255, 255, 255);
      font-family:
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        &quot;Segoe UI&quot;,
        Roboto,
        &quot;Helvetica Neue&quot;,
        Arial,
        &quot;Noto Sans&quot;,
        sans-serif,
        &quot;Apple Color Emoji&quot;,
        &quot;Segoe UI Emoji&quot;,
        &quot;Segoe UI Symbol&quot;,
        &quot;Noto Color Emoji&quot;;
    "
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        max-width: 37.5em;
        margin-left: auto;
        margin-right: auto;
        margin-top: 40px;
        margin-bottom: 40px;
        width: 465px;
        border-radius: 0.25rem;
        border-width: 1px;
        border-style: solid;
        border-color: rgb(234, 234, 234);
        padding: 20px;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-top: 32px"
            >
              <tbody>
                <tr>
                  <td>
                    <img
                      alt="Vercel"
                      height="auto"
                      src="https://firebasestorage.googleapis.com/v0/b/urbanbuzz-bcfbd.appspot.com/o/static%2Flogo-text-horizontal.jpg?alt=media&token=774a6f55-67b8-4287-8441-f80c3b918efd"
                      style="
                        display: block;
                        outline: none;
                        border: none;
                        text-decoration: none;
                        margin-left: auto;
                        margin-right: auto;
                        margin-top: 0px;
                        margin-bottom: 0px;
                        background-color: rgb(255, 255, 255);
                        width: 100%;
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <h1
              style="
                margin-left: 0px;
                margin-right: 0px;
                margin-top: 30px;
                margin-bottom: 30px;
                padding: 0px;
                text-align: center;
                font-size: 24px;
                font-weight: 400;
                color: rgb(0, 0, 0);
              "
            >
              Your Project Has a New Update
            </h1>
            <p style="font-size: 14px; line-height: 24px; margin: 16px 0; color: rgb(0, 0, 0)">
              A Honey Meadows admin has logged an update to your project
              <strong>${project?.name}</strong>. click the following button to see the update.
            </p>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom: 32px; margin-top: 32px; text-align: center"
            >
              <tbody>
                <tr>
                  <td>
                    <a
                      href="https://app.honeymeadows.ca/admin/projects/${project?.id}"
                      style="
                        border-radius: 0.25rem;
                        background-color: #3c53e4;
                        padding-left: 5rem;
                        padding-right: 5rem;
                        padding-top: 1.5rem;
                        padding-bottom: 1.5rem;
                        text-align: center;
                        font-size: 12px;
                        font-weight: 600;
                        color: rgb(255, 255, 255);
                        text-decoration-line: none;
                        line-height: 100%;
                        text-decoration: none;
                        display: inline-block;
                        max-width: 100%;
                        padding: 24px 80px 24px 80px;
                      "
                      target="_blank"
                      ><span
                        ><!--[if mso
                          ]><i
                            style="letter-spacing: 80px; mso-font-width: -100%; mso-text-raise: 36"
                            hidden
                            >&nbsp;</i
                          ><!
                        [endif]--></span
                      ><span
                        style="
                          max-width: 100%;
                          display: inline-block;
                          line-height: 120%;
                          mso-padding-alt: 0px;
                          mso-text-raise: 18px;
                        "
                        >View</span
                      ><span
                        ><!--[if mso
                          ]><i style="letter-spacing: 80px; mso-font-width: -100%" hidden
                            >&nbsp;</i
                          ><!
                        [endif]--></span
                      ></a
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="
                width: 100%;
                border: none;
                border-top: 1px solid #eaeaea;
                margin-left: 0px;
                margin-right: 0px;
                margin-top: 26px;
                margin-bottom: 26px;
                border-width: 1px;
                border-style: solid;
                border-color: rgb(234, 234, 234);
              "
            />
            <p
              style="font-size: 12px; line-height: 24px; margin: 16px 0; color: rgb(102, 102, 102)"
            >
              This invitation was intended for
              <span style="color: rgb(0, 0, 0)">${email} </span>.This invite was sent from
              <span style="color: rgb(0, 0, 0)">Honey Meadows Farm Inc.</span> located in
              <span style="color: rgb(0, 0, 0)">CANADA</span>. If you were not expecting this
              invitation, you can ignore this email.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
};
