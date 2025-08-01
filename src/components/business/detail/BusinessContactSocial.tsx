import React from "react";
import {
  MapPin,
  Globe,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  trackWebsiteClick,
  trackPhoneClick,
  trackEmailClick,
  trackSocialClick,
} from "../../../utils/analyticsUtils";

interface BusinessContactSocialProps {
  business: any;
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const BusinessContactSocial: React.FC<BusinessContactSocialProps> = ({
  business,
}) => {
  if (!business) return null;

  // Add debugging to see what data is being received
  console.log("🔍 BusinessContactSocial received business data:", {
    id: business.id,
    name: business.name,
    city: business.city,
    state: business.state,
    zip_code: business.zip_code,
    website_url: business.website_url,
    phone: business.phone,
    email: business.email,
    social_links: business.social_links,
    business_hours: business.business_hours,
    business_hours_type: typeof business.business_hours,
    business_hours_keys: business.business_hours
      ? Object.keys(business.business_hours)
      : [],
  });

  const handleWebsiteClick = async (e: React.MouseEvent) => {
    try {
      await trackWebsiteClick(business.id, business.website_url);
    } catch (error) {
      console.error("Error tracking website click:", error);
    }
    // Continue with normal link behavior
  };

  const handlePhoneClick = async (e: React.MouseEvent) => {
    try {
      await trackPhoneClick(business.id, business.phone);
    } catch (error) {
      console.error("Error tracking phone click:", error);
    }
    // Continue with normal link behavior
  };

  const handleEmailClick = async (e: React.MouseEvent) => {
    try {
      await trackEmailClick(business.id, business.email);
    } catch (error) {
      console.error("Error tracking email click:", error);
    }
    // Continue with normal link behavior
  };

  const handleSocialClick = async (platform: string, url: string) => {
    try {
      await trackSocialClick(business.id, platform, url);
    } catch (error) {
      console.error("Error tracking social click:", error);
    }
    // Continue with normal link behavior
  };

  // Function to get the appropriate icon for each social platform
  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();

    switch (platformLower) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "theblacktube":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 461 447"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path
              d="M202.892215,0.483398438 L204.910104,2.16384957 L208.945882,9.2217443 L213.990605,17.9600902 L218.699013,26.3623458 L222.062161,32.0758796 L226.770569,40.4781353 L230.806347,47.53603 L233.833181,52.5773834 L235.85107,56.2743759 L239.214218,62.3239999 L243.586311,70.0540751 L258.384165,95.9330225 L263.092573,104.335278 L267.128351,111.393173 L270.827814,117.778887 L273.182018,120.467609 L274.527277,121.139789 L278.563056,121.139789 L280.24463,119.795429 L282.935149,113.073624 L288.316186,98.9578345 L293.024594,86.8585864 L297.396687,75.767609 L299.414576,70.3901654 L303.786669,58.9630977 L307.486132,49.5525714 L311.858225,38.4615939 L312.530855,38.4615939 L312.86717,39.1337744 L312.86717,41.8224962 L310.849281,48.2082105 L308.495077,56.6104661 L304.459299,70.0540751 L299.750891,85.8503157 L294.033539,105.007459 L289.99776,118.787158 L289.661446,120.131519 L289.661446,123.156331 L295.715113,124.500692 L320.938726,128.197684 L340.108673,130.886406 L365.668601,134.583398 L377.103306,136.26385 L393.582734,139.288662 L408.044272,142.649564 L417.797403,145.338286 L429.904737,149.371368 L437.976293,152.732271 L443.693646,155.420992 L450.083628,159.454075 L453.446776,162.142797 L456.809925,165.167609 L459.164129,167.520241 L460.509388,170.208962 L460.845703,171.553323 L460.845703,173.905955 L457.818869,172.225504 L453.110462,169.536782 L447.729424,166.84806 L437.976293,163.151068 L430.577367,160.798436 L416.115828,156.765353 L405.353753,154.076632 L393.582734,151.38791 L376.766991,148.027007 L349.525488,143.321744 L326.319764,139.624752 L299.078261,135.255579 L272.173073,131.222496 L245.6042,127.189413 L221.389531,123.156331 L204.573789,120.131519 L190.112251,117.442797 L182.713324,116.434526 L179.350175,116.098436 L162.534433,116.098436 L153.453932,117.442797 L147.06395,119.123248 L142.019227,121.139789 L137.647134,123.492421 L134.283986,126.181143 L132.266097,127.861594 L129.575578,131.222496 L126.885059,135.591669 L125.203485,140.296932 L124.19454,144.666105 L123.858225,151.38791 L124.530855,163.151068 L125.5398,194.407459 L126.548744,218.942045 L127.557689,261.289413 L128.230319,301.956331 L128.902948,356.066857 L129.239263,374.88791 L129.911893,385.306707 L130.920837,392.364601 L132.602412,400.430767 L134.956615,408.160842 L138.656079,416.899188 L141.682912,422.276632 L144.709746,425.973624 L147.06395,428.662346 L151.772358,432.359338 L155.808136,434.71197 L161.189174,436.728511 L164.552322,437.400692 L171.614934,437.400692 L435.285775,399.086406 L437.303664,399.086406 L437.976293,400.094677 L433.6042,401.102947 L399.972716,407.152571 L348.852859,416.227007 L310.512966,422.948812 L275.872537,428.998436 L247.958404,433.703699 L213.65429,439.417233 L186.412787,443.786406 L171.278619,446.139038 L163.207063,447.147308 L158.83497,447.483398 L142.019227,447.483398 L134.283986,446.475128 L125.876115,444.458586 L117.468243,441.097684 L112.423521,438.408962 L107.042483,434.71197 L101.99776,430.342797 L99.6435564,427.990165 L95.9440931,423.284902 L92.9172595,418.579639 L90.2267407,413.202195 L88.2088516,408.160842 L86.8635922,403.791669 L85.5183328,396.733774 L84.8457031,388.667609 L84.8457031,169.200692 L85.182018,160.126256 L86.1909625,152.06009 L87.8725368,143.993925 L90.5630555,135.927759 L93.2535743,129.878135 L96.9530377,124.164601 L100.652501,119.795429 L104.688279,115.762346 L109.733002,112.065353 L114.777725,109.040541 L120.495077,106.351819 L127.557689,103.999188 L133.947671,102.654827 L138.992394,101.982647 L144.373431,101.646556 L149.418154,101.646556 L158.498655,102.318737 L170.269675,103.999188 L209.282197,110.384902 L255.693646,118.114977 L257.711535,118.787158 L260.065739,118.787158 L260.402054,118.787158 L260.402054,116.098436 L256.70259,109.376632 L254.012072,103.663098 L251.321553,98.2856541 L246.613145,89.211218 L228.452143,52.9134736 L225.42531,47.1999398 L203.22853,2.83603002 L202.892215,0.483398438 Z M78.0835672,105.483398 L78.7534701,105.819367 L79.0884216,106.827272 L79.0884216,126.313438 L77.7486157,130.681027 L74.3991012,135.720553 L71.3845381,142.103952 L70.0447323,146.807509 L69.3748293,152.183003 L69.3748293,159.910276 L71.3845381,244.910276 L72.3893924,289.258102 L73.3942468,336.629643 L74.3991012,387.360869 L74.7340526,399.45573 L75.738907,405.83913 L77.7486157,411.88656 L80.0932759,416.590118 L82.7728876,420.28577 L85.4524992,423.309485 L88.8020138,425.997232 L92.4864798,428.349011 L95.5010429,431.036758 L97.1758002,434.396442 L97.8457031,438.092094 L97.8457031,442.123715 L97.1758002,444.475493 L96.1709458,445.14743 L88.8020138,445.483398 L67.7000721,445.483398 L62.0058973,444.475493 L55.9767711,442.459683 L49.6126934,439.099999 L45.9282274,436.076284 L42.5787128,433.052568 L38.8942468,428.013043 L36.2146352,423.309485 L33.869975,416.254149 L32.8651206,410.878655 L32.5301691,405.83913 L30.8554119,289.930039 L30.8554119,275.483398 L29.8505575,275.483398 L29.515606,187.459683 L28.8457031,154.198813 L28.8457031,141.432015 L29.8505575,134.712647 L31.8602662,128.665217 L34.5398779,123.625691 L37.2194895,119.930039 L40.9039556,115.898418 L45.2583245,112.202766 L50.6175478,109.179051 L55.9767711,107.16324 L62.6758002,105.819367 L65.6903633,105.483398 L78.0835672,105.483398 Z M190.845703,136.483398 L192.526676,137.154896 L199.922956,141.51963 L206.983042,145.884365 L225.809938,157.299824 L230.180467,159.985814 L256.739838,176.101756 L264.472313,180.802239 L271.532398,185.166973 L279.937262,190.203205 L288.678321,195.575186 L295.402212,199.604171 L302.462298,203.968906 L309.18619,207.997891 L316.918664,212.698374 L323.97875,217.063109 L330.702642,221.092094 L338.435117,225.792577 L377.097491,249.294993 L384.157577,253.659727 L392.562441,258.695959 L398.613943,262.389196 L407.355002,267.761176 L414.078893,271.790162 L421.811368,276.490645 L425.509509,278.840886 L425.845703,279.848133 L419.121812,283.541369 L411.053142,288.241853 L401.639695,293.613833 L384.157577,303.686297 L374.744129,309.058278 L366.67546,313.758761 L357.262012,319.130741 L339.779895,329.203205 L330.366447,334.575186 L322.297778,339.275669 L313.556719,344.311901 L304.143271,349.683882 L296.074602,354.384365 L287.669737,359.084848 L280.273457,363.449582 L270.860009,368.821563 L262.79134,373.522046 L254.386476,378.222529 L246.990195,382.587263 L237.576747,387.959244 L229.508078,392.659727 L221.775603,397.024461 L213.706933,401.724944 L204.293486,407.096925 L196.224816,411.797408 L191.518092,414.483398 L190.845703,414.483398 L190.845703,136.483398 Z M207.319237,233.850548 L199.250567,233.850548 L197.569594,234.522046 L197.2334,235.193543 L197.2334,246.944751 L197.905789,248.287746 L201.603929,248.623495 L206.310653,248.959244 L208.32782,248.623495 L209.336404,248.959244 L212.025961,248.959244 L212.362155,252.652481 L212.69835,253.995476 L212.69835,254.666973 L212.362155,259.703205 L212.362155,266.75393 L213.034544,267.425427 L213.034544,266.418181 L213.706933,266.75393 L213.706933,268.096925 L212.362155,268.768423 L212.362155,319.46649 L213.034544,322.488229 L213.706933,322.823978 L223.79277,323.159727 L226.482327,323.159727 L228.499494,322.152481 L228.835689,320.137988 L228.835689,291.935089 L228.1633,290.592094 L228.835689,289.920597 L228.835689,270.447167 L229.171883,249.294993 L229.508078,248.959244 L242.95586,248.623495 L243.964444,247.2805 L244.300639,244.930258 L243.964444,235.193543 L243.292055,234.186297 L242.283471,233.850548 L221.775603,233.850548 L220.430825,234.186297 L208.32782,234.186297 L207.319237,233.850548 Z M272.877177,233.850548 L252.033114,233.850548 L250.352141,234.857795 L250.015946,235.865041 L250.015946,319.130741 L250.688335,322.488229 L251.02453,322.823978 L254.050281,323.159727 L268.842842,323.159727 L279.264873,322.823978 L282.290624,322.152481 L285.988765,320.809485 L289.014516,318.459244 L291.704072,315.773254 L294.057434,311.07277 L295.066018,307.379534 L295.402212,303.350548 L295.402212,290.927843 L294.393629,286.22736 L293.04885,282.869872 L290.695489,279.848133 L287.669737,277.162142 L288.342127,275.819147 L290.695489,273.804654 L292.712656,270.447167 L293.72124,268.432674 L294.393629,264.739437 L294.393629,252.652481 L293.72124,247.951997 L291.704072,242.580017 L289.35071,239.558278 L287.669737,237.543785 L283.971597,235.865041 L280.273457,234.522046 L278.592484,234.186297 L272.877177,233.850548 Z M343.14184,233.850548 L299.436547,233.850548 L298.091769,234.857795 L298.091769,240.229775 L297.755574,242.915766 L298.091769,247.2805 L299.100353,248.623495 L310.867162,248.959244 L312.88433,249.630741 L313.220524,258.695959 L313.220524,321.480983 L314.901497,323.159727 L327.340696,323.159727 L329.021669,322.488229 L329.694058,320.809485 L329.694058,263.396442 L330.030252,249.294993 L332.719809,248.623495 L343.81423,248.623495 L344.822813,247.2805 L344.822813,235.193543 L344.150424,234.186297 L343.14184,233.850548 Z M273.714124,284.483398 L276.450966,286.510425 L277.819387,288.199615 L278.845703,293.60502 L278.845703,301.713128 L277.819387,306.780696 L275.42465,308.807723 L273.714124,309.483398 L266.872019,309.483398 L266.187808,308.807723 L265.845703,307.118534 L265.845703,285.496912 L266.529914,284.483398 L273.714124,284.483398 Z M271.845703,248.483398 L274.845703,249.159869 L276.51237,250.174575 L277.845703,252.542222 L278.51237,255.924575 L278.845703,259.983398 L278.179036,266.071634 L277.179036,269.115751 L274.51237,271.145163 L272.179036,271.483398 L268.51237,271.483398 L267.179036,270.806928 L266.845703,270.130457 L266.845703,249.498104 L267.51237,248.483398 L271.845703,248.483398 Z M219.845703,235.483398 L220.845703,236.483398 L219.845703,236.483398 L219.845703,235.483398 Z M12.4414478,204.483398 L14.8244265,204.819464 L15.8457031,205.827661 L15.8457031,325.130939 L15.1648521,327.147333 L13.1222989,327.483398 L9.71804355,325.803071 L6.65421376,323.450612 L4.27123504,321.098153 L1.54783078,316.7293 L0.186128657,312.024382 L-0.154296875,308.663726 L-0.154296875,223.303071 L0.526554189,218.262087 L2.22868185,213.893235 L4.61166057,210.532579 L7.67549036,207.507989 L11.0797457,205.15553 L12.4414478,204.483398 Z"
              fillRule="nonzero"
            ></path>
          </svg>
        );
      case "fanbase":
        return (
          <svg
            viewBox="0 0 512 512"
            className="h-5 w-5 -ml-[3px] mt-[2px]"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M199.7,62.7l-93.4,246.3h33.9l-58.8,147l155.2-196.6h-25l28.5-49.4H284l34.9-41.8h-53.7l25.7-39h78l61.9-66.4H199.7z"
            />
          </svg>
        );
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  // Helper function to get day label
  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Helper function to check if business hours exist and have data
  const hasBusinessHours = () => {
    if (!business.business_hours) return false;

    // Check if it's an object and has any non-empty values
    if (typeof business.business_hours === "object") {
      return Object.values(business.business_hours).some(
        (hours: any) => hours && hours !== "" && hours !== "Select hours"
      );
    }

    return false;
  };

  // Check if we have any contact information to display
  const hasContactInfo =
    business.city || business.website_url || business.phone || business.email;

  console.log("🔍 BusinessContactSocial hasContactInfo:", hasContactInfo);
  console.log("🔍 BusinessContactSocial hasBusinessHours:", hasBusinessHours());

  if (!hasContactInfo && !hasBusinessHours()) {
    console.log(
      "🔍 BusinessContactSocial: No contact info or business hours to display"
    );
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">
        Contact Information
      </h2>
      <div className="space-y-4">
        {/* Location - Show if we have any location info */}
        {(business.city || business.state || business.zip_code) && (
          <div className="flex items-center text-gray-400">
            <MapPin className="h-5 w-5 mr-3" />
            <span>
              {[business.city, business.state, business.zip_code]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        {business.website_url && (
          <div className="flex items-center text-gray-400">
            <Globe className="h-5 w-5 mr-3" />
            <a
              href={business.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300"
              onClick={handleWebsiteClick}
            >
              Visit website
            </a>
          </div>
        )}

        {business.phone && (
          <div className="flex items-center text-gray-400">
            <Phone className="h-5 w-5 mr-3" />
            <a
              href={`tel:${business.phone}`}
              className="text-white hover:text-gray-300"
              onClick={handlePhoneClick}
            >
              {business.phone}
            </a>
          </div>
        )}

        {business.email && (
          <div className="flex items-center text-gray-400">
            <Mail className="h-5 w-5 mr-3" />
            <a
              href={`mailto:${business.email}`}
              className="text-white hover:text-gray-300"
              onClick={handleEmailClick}
            >
              Email business owner
            </a>
          </div>
        )}

        {/* Business Hours Section */}
        {hasBusinessHours() && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 mr-3 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Business Hours
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const hours = business.business_hours[day];
                // Only show days that have hours set and are not empty
                if (!hours || hours === "" || hours === "Select hours") {
                  return null;
                }

                return (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">
                      {getDayLabel(day)}
                    </span>
                    <span className="text-white font-medium">{hours}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Social Media Links */}
      {business.social_links &&
        Object.keys(business.social_links).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">
              Social Media
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(business.social_links)
                .filter(([_, url]) => url && url !== "") // Only show non-empty social links
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-white hover:text-gray-300 transition-colors"
                    onClick={() => handleSocialClick(platform, url as string)}
                  >
                    <span className="mr-2">{getSocialIcon(platform)}</span>
                    <span>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default BusinessContactSocial;
