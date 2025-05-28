import dayjs from "dayjs";

export const projectCreate = ({ project }) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
<html dir="ltr" lang="en">
  <head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400..700;1,400..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"></head>
  <body
    style="
      margin-left: auto;
      margin-right: auto;
      margin-top: auto;
      margin-bottom: auto;
      background-color: rgb(255, 255, 255);
font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
        'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
        'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
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
        width: 640px;
        margin-left: auto;
        margin-right: auto;
        margin-top: 40px;
        margin-bottom: 40px;
        border-width: 1px;
        border-style: solid;
        border-color: #deeaff;
        border-radius: 10px;
        overflow: auto;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="background-color: #fffdf2 !important; padding: 30px;
        border-radius: 10px 10px 0 0;"
            >
              <tbody>
                <tr>
                  <td>
                    <img
                      alt="Vercel"
                      height="auto"
                      src="https://app.honeymeadows.ca/images/email/hm-logo.png"
                      style="
                        display: block;
                        outline: none;
                        border: none;
                        text-decoration: none;
                        margin-top: 0px;
                        height: 94px;
                        width: auto;
                      "
                    />
                    <h1
                      style="
                        margin-top: 20px;
                        margin-bottom: 0px;
                        padding: 0px;
                        text-align: left;
                        font-size: 30px;
                        font-weight: 600;
                        color: rgb(0, 0, 0);
                      "
                    >
                      ${project?.name} Project Has Been Created
                    </h1>
                    <p
                      style="
                        margin-bottom: 0px;
                        line-height: 24px;
                        margin-top: 10px;
                        color: rgb(0, 0, 0);
                        font-size: 20px;
                      "
                    >
                      <a
                        href="https://app.honeymeadows.ca"
                        style="
                          border-radius: 0.25rem;
                          color: #0067ee;
                          text-decoration-line: none;
                          line-height: 100%;
                          text-decoration: none;
                          display: inline-block;
                        "
                        target="_blank"
                        >Log in</a
                      >
                      to our app to view the project.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="background-color: #ffffff; padding: 20px;"
            >
              <tbody>
                <tr>
                  <td>
                    <p
                      style="
                        margin-top: 0px;
                        margin-bottom: 10px;
                        line-height: 24px;
                        color: rgb(0, 0, 0);
                        font-size: 20px;
                        font-weight: 600px;
                      "
                    >
                      Created on ${dayjs(new Date(project?.created)).format("MMM DD, YYYY H:MM A")}
                    </p>
     

    
                      <a
                      href="https://app.honeymeadows.ca/dashboard/projects/${project?.id}"
                      style="
                        border-radius: 10px;
                        background-color: #3c53e4;
                        padding-left: 20px;
                        padding-right: 20px;
                        padding-top: 10px;
                        padding-bottom: 10px;
                        text-align: center;
                        font-size: 18px;
                        color: #666352;
                        text-decoration-line: none;
                        line-height: 100%;
                        display: inline-block;
                        max-width: 100%;
                        background-color: #EEC800;
                      "
                      target="_blank"
                      ><span
                        style="
                          max-width: 100%;
                          display: inline-block;
                          line-height: 120%;
                          mso-padding-alt: 0px;
                          mso-text-raise: 18px;
                        "
                        >Go to project</span
                      ></a
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
                margin-top: 20px;
                margin-bottom: 0px;
                border-width: 1px;
                border-style: solid;
                border-color: rgb(234, 234, 234);
              "
            />
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="background-color: #fffdf2 !important; padding-left: 20px;padding-right: 20px;padding-top: 20px;padding-bottom: 20px;
        border-radius: 0 0 10px 10px;"
            >
              <tbody>
                <tr>
                  <td>
                                        <p
                      style="
                      text-align: center;
                        margin-bottom: 0px;
                        line-height: 24px;
                        margin-top: 0px;
                        margin-bottom: 20px;
                        color: #71747A;
                        font-size: 14px;
                      "
                    >
                      Sent with love, from
                    </p>
                    <img
                      alt="Vercel"
                      height="auto"
                      src="https://app.honeymeadows.ca/images/email/hm-logo.png"
                      style="
                        display: block;
                        outline: none;
                        border: none;
                        text-decoration: none;
                        margin-top: 0px;
                        margin-left: auto;
                        margin-right: auto;
                        margin-bottom: 20px;
                        height: 94px;
                        width: auto;
                      "
                    />
                    <p
                      style="
                      text-align: center;
                        line-height: 24px;
                        margin: 20px auto 20px auto;
                        color: #71747A;
                        font-size: 18px;
                        max-width: 318px;
                      "
                    >
                290045 192 Street E, Foothills, Alberta T1S 4A3, Canada
                    </p>
                                <hr
              style="
                width: 100%;
                border: none;
                border-top: 1px solid #eaeaea;
                margin: 0px auto 0px auto;
                border-width: 1px;
                border-style: solid;
                border-color: rgb(234, 234, 234);
                        width: 190px;
              "
            />
                    <p
                      style="
                      text-align: center;
                        line-height: 24px;
                        margin: 20px auto 20px auto;
                        color: #71747A;
                        font-size: 18px;
                        max-width: 318px;
                      "
                    >
              If you have any questions, please email us at  
                      <a
                        href="mailto:info@honeymeadows.ca"
                        style="
                          border-radius: 0.25rem;
                          color: #0067ee;
                          text-decoration-line: none;
                          line-height: 100%;
                          display: inline-block;
                          text-decoration: underline;
                        "
                        target="_blank"
                        >info@honeymeadows.ca</a>.
                    </p>
                                      
                  <p style="
                      text-align: center;
                        line-height: 24px;
                        margin: 20px auto 20px auto;
                        color: #71747A;
                        font-size: 14px;
                        max-width: 318px;">
                        <a href=""
                        style="
                          border-radius: 0.25rem;
                          color: #A8A8A8;
                          text-decoration-line: none;
                          line-height: 100%;
                          text-decoration: none;
                          display: inline-block;
                          margin-right: 20px;
                        "
                        target="_blank"
                        >T&Cs</a>
                        <a href=""
                        style="
                          border-radius: 0.25rem;
                          color: #A8A8A8;
                          text-decoration-line: none;
                          line-height: 100%;
                          text-decoration: none;
                          display: inline-block;
                          margin-right: 20px;
                        "
                        target="_blank"
                        >Privacy Policy</a>
                        <a href=""
                        style="
                          border-radius: 0.25rem;
                          color: #A8A8A8;
                          text-decoration-line: none;
                          line-height: 100%;
                          text-decoration: none;
                          display: inline-block;
                        "
                        target="_blank"
                        >Contact Us</a>
                  </p>
                  
                    <p
                      style="
                      text-align: center;
                        line-height: 24px;
                        margin: 20px auto 10px auto;
                        color: #71747A;
                        font-size: 18px;
                        max-width: 418px;
                      "
                    >You can update your preference or unsubscribe from these emails
                      <a
                        href="https://app.honeymeadows.ca/dashboard/settings"
                        style="
                          border-radius: 0.25rem;
                          color: #0067ee;
                          text-decoration-line: none;
                          line-height: 100%;
                          text-decoration: underline;
                          display: inline-block;
                        "
                        target="_blank"
                        >here</a>.
                    </p>
                  
                    <p
                      style="
                      text-align: center;
                        line-height: 24px;
                        margin: 20px auto 10px auto;
                        color: #D4D5D8;
                        font-size: 18px;
                      "
                    >Copyright © 2025, Honey Meadows Farm Inc..
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
};
