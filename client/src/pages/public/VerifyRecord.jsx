
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiSun,
  FiChevronDown,
  FiClock,
  FiLogIn,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaExternalLinkAlt, FaUserShield, FaUsers } from "react-icons/fa";
import { MdDarkMode } from "react-icons/md";

import api from "../../services/api";
import azadiLogo from "../../assets/images/logos/azadi_logo_light-min.png";
import crsLogo from "../../assets/images/logos/crs-logo-light.png";
import crsLogoMobile from "../../assets/images/logos/crs-logo-lightbg.png";
import crsWatermark from "../../assets/images/logos/crs-logo-lightbg.png";
import emblem from "../../assets/images/logos/emblem.png";
import footerLogoSprite from "../../assets/images/footer/footer-logo-sprite.png";
import iycLogo from "../../assets/images/footer/iyc.7f6fc3ee5e3c155d147b.png";
import makeInIndiaLogo from "../../assets/images/footer/make-in-india.png";
import flagBackground from "../../assets/images/backgrounds/flag.svg";
import "./CertificateVerification.css";

const pageLoadedAt = new Date();

const publicFields = [
  ["Registration Number", "registrationNumber"],
  ["NAME", "fullName"],
  ["GENDER", "gender"],
  ["DOD", "dateOfOccurrence"],
  ["Name Of Mother", "motherName"],
  ["Name Of Father", "fatherName"],
  ["Place of Death", "placeOfOccurrence"],
  ["Registration Date", "registrationDate"],
  ["Registration Unit Name", "registrationUnitName"],
  ["Registration Unit Code", "registrationUnitCode"]
];

function formatValue(value, field) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (
    field.toLowerCase().includes("date") ||
    field === "dateOfOccurrence"
  ) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value.split("-").reverse().join("-");
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB").replaceAll("/", "-");
    }
  }

  return String(value);
}

export default function VerifyRecord() {
  const { verificationId } = useParams();

  const [result, setResult] = useState({
    verificationId: null,
    loading: true,
    status: null,
    record: null,
    message: "",
    disclaimer: ""
  });

  const [fontScale, setFontScale] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const loginDropdownRef = useRef(null);
  const [loadingState, setLoadingState] = useState({
    verificationId: null,
    phase: "logo"
  });

  useEffect(() => {
    if (!loginMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(event.target)
      ) {
        setLoginMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLoginMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginMenuOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const loadingStartedAt = Date.now();
    let responseTimer;
    let detailsTimer;
    let finishTimer;

    const showLoadingStages = (nextResult) => {
      const remainingLogoTime = Math.max(0, 900 - (Date.now() - loadingStartedAt));

      responseTimer = window.setTimeout(() => {
        if (controller.signal.aborted) return;

        setResult(nextResult);
        setLoadingState({ verificationId, phase: "dots-footer" });

        detailsTimer = window.setTimeout(() => {
          if (controller.signal.aborted) return;

          setLoadingState({ verificationId, phase: "dots-details" });
          finishTimer = window.setTimeout(() => {
            if (!controller.signal.aborted) {
              setLoadingState({ verificationId, phase: "done" });
            }
          }, 1200);
        }, 700);
      }, remainingLogoTime);
    };

    api
      .get(`/public/verify/${encodeURIComponent(verificationId)}`, {
        signal: controller.signal
      })
      .then(({ data }) => {
        showLoadingStages({
          verificationId,
          loading: false,
          ...data
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        const notFound =
          error.response?.status === 404 ||
          error.response?.status === 400;

        showLoadingStages({
          verificationId,
          loading: false,
          status: notFound ? "not_found" : "error",
          record: null,
          message: notFound
            ? "No matching record was found."
            : "We could not reach the verification service. Please try again later."
        });
      });

    return () => {
      controller.abort();
      window.clearTimeout(responseTimer);
      window.clearTimeout(detailsTimer);
      window.clearTimeout(finishTimer);
    };
  }, [verificationId]);

  const isLoading =
    result.loading || result.verificationId !== verificationId;

  const visibleResult = isLoading ? null : result;
  const status = visibleResult?.status;
  const loadingPhase =
    loadingState.verificationId === verificationId
      ? loadingState.phase
      : "logo";
  const showCertificateContent =
    !isLoading &&
    (loadingPhase === "dots-details" || loadingPhase === "done");
  const showLoadingOverlay = isLoading || loadingPhase !== "done";

  return (
    <div
      className={`certificate-verification ${
        darkMode ? "cv-dark" : ""
      }`}
      style={{ "--cv-font-scale": fontScale }}
    >
      {/* HEADER */}
      <header className="cv-header">
        {/* Single responsive flag background. CSS creates mirrored halves. */}
        <div
          className="cv-header-flag-layer"
          style={{ "--cv-flag-image": `url("${flagBackground}")` }}
          aria-hidden="true"
        />

        {/* Keep the national emblem separate from the background layer. */}
        <div className="cv-header-emblem" aria-hidden="true">
          <img className="cv-logo-emblem" src={emblem} alt="" />
        </div>
        <div className="cv-header-inner">
          <div className="cv-header-brand-logos" aria-label="Header logos">
            <img
              className="cv-logo-crs-desktop"
              src={crsLogo}
              alt="Birth and Death Registration"
            />
            <img
              className="cv-logo-crs-mobile"
              src={crsLogoMobile}
              alt="Birth and Death Registration"
            />
            <img
              className="cv-logo-azadi"
              src={azadiLogo}
              alt="Azadi Ka Amrit Mahotsav"
            />
          </div>

          <div className="cv-header-actions">

            {/* FONT CONTROLS */}
            <div className="cv-font-controls">
              <button
                type="button"
                title="Decrease font size"
                onClick={() =>
                  setFontScale((size) =>
                    Math.max(0.9, Number((size - 0.1).toFixed(1)))
                  )
                }
              >
                A-
              </button>

              <button
                type="button"
                title="Reset font size"
                onClick={() => setFontScale(1)}
              >
                A
              </button>

              <button
                type="button"
                title="Increase font size"
                onClick={() =>
                  setFontScale((size) =>
                    Math.min(1.3, Number((size + 0.1).toFixed(1)))
                  )
                }
              >
                A+
              </button>
            </div>

            {/* DARK MODE */}
            <button
              type="button"
              className="cv-theme-toggle"
              title={darkMode ? "Light mode" : "Dark mode"}
              aria-label={darkMode ? "Use light theme" : "Use dark theme"}
              onClick={() => setDarkMode((dark) => !dark)}
            >
              {darkMode ? <FiSun /> : <MdDarkMode className="cv-moon-icon" />}
            </button>

            <div
              className={`cv-login-dropdown${loginMenuOpen ? " cv-login-dropdown--open" : ""}`}
              ref={loginDropdownRef}
            >
              <button
                type="button"
                className="cv-admin-link"
                aria-haspopup="menu"
                aria-expanded={loginMenuOpen}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginMenuOpen((open) => !open);
                }}
              >
                <span className="cv-admin-link-label">Login</span>
                <FiChevronDown className="cv-admin-link-chevron" aria-hidden="true" />
                <FiLogIn className="cv-admin-link-icon" aria-hidden="true" />
              </button>
              {loginMenuOpen && (
                <div className="cv-login-menu" role="menu" aria-label="Login options">
                  <a
                    className="cv-login-option"
                    role="menuitem"
                    href="https://dc.crsorgi.gov.in/crs/Auth/general-public"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <FaUsers aria-hidden="true" />
                    <span>General Public</span>
                  </a>
                  <a
                    className="cv-login-option"
                    role="menuitem"
                    href="https://dc.crsorgi.gov.in/crs/Auth/admin"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <FaUserShield aria-hidden="true" />
                    <span>Reg.Functionaries / Institution</span>
                  </a>
                  <a
                    className="cv-login-option"
                    role="menuitem"
                    href="https://ana.crsorgi.gov.in/bi-security-login/login.jsp?msi=false&mt=false&profileMust=true&redirect=L2FuYWx5dGljcy9zYXcudGxsP2JpZWVob21lJnN0YXJ0UGFnZT0xJmhhc2g9NWZCSXZmTDMxUVl0V0hLajBqaGR1aTg1THlFSFJHMEc0QnI5NmF0VmtXSHJLeW5uRUR1a3pGMXNwNE5JQ2JtVQ=="
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <FaExternalLinkAlt aria-hidden="true" />
                    <span>CRS Analytics</span>
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              className="cv-mobile-menu-toggle"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="cv-main-navigation"
              onClick={() => {
                setLoginMenuOpen(false);
                setMobileMenuOpen((open) => !open);
              }}
            >
              {mobileMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav
        className={`cv-nav${mobileMenuOpen ? " cv-nav--mobile-open" : ""}`}
        id="cv-main-navigation"
        aria-label="Main navigation"
        onClick={(event) => {
          if (event.target.closest("a")) setMobileMenuOpen(false);
        }}
      >
        <div className="cv-nav-inner">
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/crs/home">Home</a>
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/crs/about">About CRS</a>
          <details className="cv-nav-dropdown">
            <summary className="cv-nav-label">
              RBD Act and Model Rules <FiChevronDown aria-hidden="true" />
            </summary>
            <div className="cv-nav-menu">
              <a href="https://dc.crsorgi.gov.in/assets/download/rbd_act_1969.pdf">RBD Act, 1969</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/Births_and_Deaths_Rules_2024.pdf">RBD (Amendment) Act, 2023</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/Births_and_Deaths_Rules_1999.pdf">Model RBD Rules, 1999</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/rbd_act_2024.pdf">Model RBD (Amendment) Rules, 2024</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/GAZ_NOTIFICATION_14.pdf">Enforcement of RBD Act, 1969 Amended in 2023</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/RBD_act_2026.pdf">Registration of Births and Deaths (Amendment) Act, 2026</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/Model_RBD_act_2026.pdf">Model Registration of Births and Deaths (Amendment) Rules, 2026</a>
            </div>
          </details>
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/crs/circulars">Circulars</a>
          <details className="cv-nav-dropdown cv-nav-dropdown--forms">
            <summary className="cv-nav-label">
              Forms <FiChevronDown aria-hidden="true" />
            </summary>
            <div className="cv-nav-menu">
              <a href="https://dc.crsorgi.gov.in/assets/download/all_forms_CRS_2019_new.pdf">CRS</a>
              <a href="https://dc.crsorgi.gov.in/assets/download/MCCD_Form.pdf">MCCD</a>
            </div>
          </details>
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/crs/training-manuals">Training Manuals</a>
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/crs/certificate-verification">Verify Certificate</a>
          <a className="cv-nav-link" href="https://dc.crsorgi.gov.in/assets/download/Procedure_for_B_&_D_Registration.pdf">How To Apply</a>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="cv-main">
        <div className="cv-watermark-pattern" aria-hidden="true">
          {Array.from({ length: 100 }, (_, index) => (
            <img
              key={index}
              src={crsWatermark}
              className={index % 2 === 0 ? "cv-watermark-small" : "cv-watermark-large"}
              alt=""
            />
          ))}
        </div>

        {showCertificateContent && (
          <>
            {/* STATUS MESSAGE */}
            {status !== "active" && (
              <section
                className={`cv-status cv-status-${status || "error"}`}
                role="status"
              >
                <FiAlertCircle size={22} />

                <div>
                  <h1>
                    {status === "revoked"
                      ? "Record Revoked"
                      : status === "not_found"
                      ? "Record Not Found"
                      : "Verification Unavailable"}
                  </h1>

                  <p>{visibleResult.message}</p>
                </div>
              </section>
            )}

            {/* CERTIFICATE DETAILS */}
            {visibleResult.record && (
              <section
                className="cv-card"
                id="record-information"
              >
                <dl className="cv-details-table">
                  {publicFields.map(([label, field]) => {
                    const value = visibleResult.record[field];

                    if (
                      value === null ||
                      value === undefined ||
                      value === ""
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={field}
                        className="cv-details-row"
                      >
                        <dt>{label}</dt>

                        <dd>
                          {formatValue(value, field)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            )}

            {/* NOT FOUND */}
            {status === "not_found" && (
              <section className="cv-state cv-error-state">
                <strong>Record Not Found</strong>
                Please check your verification link or QR code.
              </section>
            )}

            {/* SERVER ERROR */}
            {status === "error" && (
              <section className="cv-state cv-error-state">
                <strong>Service Temporarily Unavailable</strong>
                Please try again later.
              </section>
            )}
          </>
        )}

      </main>

      {showLoadingOverlay && (
        <div
          className={`cv-loading-overlay cv-loading-overlay--${loadingPhase}`}
          role="status"
          aria-live="polite"
          aria-label="Checking certificate information"
        >
          <div className="cv-logo-loader" aria-hidden="true">
            <span className="cv-logo-loader__ring" />
            <img src={crsWatermark} alt="" />
          </div>
          <div className="cv-dots-loader" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="cv-loading-sr-only">Checking certificate information...</span>
        </div>
      )}

      {/* FOOTER */}
      <footer className="cv-footer">

        <ul className="cv-footer-logos" aria-label="User-provided footer logos, shown for reference only">
          <li><span className="cv-data-gov-sprite" role="img" aria-label="Data.gov.in logo, shown for reference" style={{ backgroundImage: `url(${footerLogoSprite})` }} /></li>
          <li><span className="cv-india-gov-sprite" role="img" aria-label="India.gov.in logo, shown for reference" style={{ backgroundImage: `url(${footerLogoSprite})` }} /></li>
          <li><span className="cv-pm-india-sprite" role="img" aria-label="PM India logo, shown for reference" style={{ backgroundImage: `url(${footerLogoSprite})` }} /></li>
          <li><img src={makeInIndiaLogo} alt="Make in India logo, shown for reference" /></li>
          <li><span className="cv-digital-india-sprite" role="img" aria-label="Digital India logo, shown for reference" style={{ backgroundImage: `url(${footerLogoSprite})` }} /></li>
          <li><span className="cv-mygov-sprite" role="img" aria-label="MyGov logo, shown for reference" style={{ backgroundImage: `url(${footerLogoSprite})` }} /></li>
          <li>
            <span
              className="cv-iyc-sprite"
              role="img"
              aria-label="IYC logo, shown for reference"
              style={{ backgroundImage: `url(${iycLogo})` }}
            />
          </li>
        </ul>

        <div className="cv-footer-links" aria-label="Footer information">
          <div className="cv-footer-link-row">
            <a href="https://dc.crsorgi.gov.in/crs/website-policy" target="_blank" rel="noopener noreferrer">Website Policy</a>
            <a href="https://dc.crsorgi.gov.in/crs/mobile-app-policy" target="_blank" rel="noopener noreferrer">Mobile App Privacy Policy</a>
            <a href="https://dc.crsorgi.gov.in/crs/terms-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
            <a href="https://dc.crsorgi.gov.in/crs/accessibility-statement" target="_blank" rel="noopener noreferrer">Accessibility Statement</a>
            <a href="https://dc.crsorgi.gov.in/crs/web-information-manager" target="_blank" rel="noopener noreferrer">Web Information Manager</a>
          </div>
          <div className="cv-footer-link-row">
            <span>Feedback</span>
            <a href="https://dc.crsorgi.gov.in/crs/sitemap" target="_blank" rel="noopener noreferrer">Sitemap</a>
            <a href="https://dc.crsorgi.gov.in/crs/contact" target="_blank" rel="noopener noreferrer">Contact Us</a>
            <span>Vacancies</span>
            <a href="https://dc.crsorgi.gov.in/crs/product-services" target="_blank" rel="noopener noreferrer">Products &amp; Services</a>
            <a href="https://dc.crsorgi.gov.in/crs/pricing" target="_blank" rel="noopener noreferrer">Pricing</a>
            <a href="https://dc.crsorgi.gov.in/crs/cancellation-policy" target="_blank" rel="noopener noreferrer">Cancellation Policy</a>
            <a href="https://dc.crsorgi.gov.in/crs/grievance-management" target="_blank" rel="noopener noreferrer">Grievance Management Policy</a>
          </div>
        </div>

        <div className="cv-footer-copy">
          
          <p>Last Updated: 30-01-2024 12:16:17</p>
          <p>Website Developed & Maintained by Office of the Registrar General  &amp; Census Commissioner of India</p>
          <p>Ministry of Home Affairs</p>
          <p className="cv-copyright">
            © {pageLoadedAt.getFullYear()} Record Verify
            {" - "} The Registrar General & Census Commissioner of India {" - "}
            <FiClock aria-hidden="true" />
            {" "}
            {pageLoadedAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit"
            })}
          </p>
        </div>

      </footer>
    </div>
  );
}
