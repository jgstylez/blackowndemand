import Layout from '../components/layout/Layout';
import { Globe, ShoppingBag, Heart } from 'lucide-react';
import NewsletterSubscription from '../components/common/NewsletterSubscription';
import ImageWithFallback from '../components/utils/ImageWithFallback';

const AboutPage = () => {
  return (
    <Layout
      title="About BlackOWNDemand | Black Dollar Network"
      description="BlackOWNDemand is a global business directory empowering Black-owned businesses through technology, community, and connection. Learn about our mission and vision."
      url="/about"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About BDN Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h1 className="text-4xl font-bold text-white mb-6">About BDN</h1>
            <p className="text-gray-300 text-lg">
              Black Dollar Network (BDN) is a Black-owned and Black-led fintech company. Since 2016, our mission at BDN has been to leverage the power of technology to educate, equip, and empower individuals in order to build stronger businesses, families, and ultimately communities.
            </p>
          </div>
          <div className="flex justify-center">
            <ImageWithFallback 
              src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bdn-logo-emblem-slogan.png" 
              fallbackSrc="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg"
              alt="Black Dollar Network logo" 
              className="rounded-xl shadow-lg"
              width="300"
              height="300"
            />
          </div>
        </div>

        {/* Media Presence Section */}
        <div className="mb-24">
          <div className="bg-gray-900 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Globe className="h-8 w-8 text-white mr-4" />
              Our Media Presence
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              We started by creating a media presence focused on promoting and educating on the beauty of the Black experience. Our mission was not to change the narrative surrounding our community, but for us to CONTROL the narrative as a community. We no longer have to wait on the media to share our positive stories—we ARE the media.
            </p>
            <p className="text-gray-300 text-lg">
              As a result, we have now grown a media presence in the hundreds of thousands, reaching millions of viewers on a monthly basis. This also includes creating our own multimedia platform within our own app, geared towards positive collaborations and impactful content.
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
          <p className="text-gray-300 text-lg">
            The other major issue that we recognized is that nothing happens without a strong economic base. Finances create chances. Our vision is to go from being a community with a trillion dollars in spending power, to building trillion dollar corporations within our community. Corporations with a conscience.
          </p>
        </div>

        {/* Shopping & Payments Section */}
        <div className="mb-24">
          <div className="bg-gray-900 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <ShoppingBag className="h-8 w-8 text-white mr-4" />
              BDN Shopping & Payments
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              In an effort to greatly increase the influx and track the circulation of dollars within the Black community, we created the BDN Shopping & Payments app. Now there's a virtual one-stop shop where customers from all communities can purchase Black-owned products and services from Black-owned businesses—with just the click of a button!
            </p>
            <p className="text-gray-300 text-lg">
              There's no upfront cost for the Black businesses to join The Network, and no cost for consumers to participate in The Network. The system is designed so that BDN only benefits when the community does.
            </p>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="hidden mb-24">
          <NewsletterSubscription />
        </div>

        {/* PROJECT UNITY Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Heart className="h-8 w-8 text-white mr-4" />
            What is PROJECT UNITY?
          </h2>
          <p className="text-gray-300 text-lg mb-12">
            PROJECT UNITY is our community-driven initiative to create lasting economic change. We invite and encourage participation from all groups. Whether you are in the Black community practicing "Comprehensive Group Economics" or you are from other communities practicing "Corrective Economics," we encourage you to make a social statement with your financial statements!
          </p>

          <div className="bg-gray-900/20 rounded-2xl p-8 lg:p-12 mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">Support PROJECT UNITY</h3>
            <p className="text-gray-300 text-lg mb-6">
              Join us in making a difference. Your donation will help to create the change you wish to see! All donations are made to Black Dollar Movement, Inc., a registered 501(c)(3) nonprofit organization. Your donation is fully tax-deductible. Your support is crucial to our mission of creating lasting economic change in our communities.
            </p>
             <a 
            href="https://www.sowempowered.com" 
            target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
          >
            <button className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-lg transition-colors">
              Support PROJECT UNITY
            </button>
             </a>
          </div>
        </div>

        {/* App Download Section - Updated with purple-to-blue gradient */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8 lg:p-12 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-1 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Buy Black. Pay Black. Get the App.</h2>
            <p className="text-gray-300 mb-12">
              Get instant access to hundreds of Black-owned businesses, exclusive rewards, and make a real impact in your community. Available for free on iOS and Android.
            </p>

            <div className="flex justify-center gap-4 mb-8">
              <a 
                href="https://apps.apple.com/us/app/black-dollar-network/id1535337044" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//app-store-badge.svg" 
                  alt="Download on the App Store" 
                  className="h-12"
                />
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.blackdollarnetwork.mobile" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//google-play-badge.svg" 
                  alt="Get it on Google Play" 
                  className="h-12"
                />
              </a>
            </div>

            <p className="text-gray-300 mb-12">USE INVITE CODE: SHOPBLKD </p>

            {/* QR Code Section */}
            <div className="mb-8">
              <div className="rounded-2xl">
                <div className="text-center">
                  <p className="text-gray-300 mb-8">
                    Or you just scan the QR code below to download
                  </p>
                  <div className="flex items-center justify-center bg-white rounded-xl shadow-lg p-4 max-w-xs mx-auto">
                    <img
                      src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bdn-qr-code.svg"
                      alt="BDN App QR Code"
                      width="120"
                      height="120"
                      className="w-[120px] h-[120px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Shop Black-Owned</h3>
                <p className="text-gray-300">
                  Gain access to shop hundreds of Black-owned businesses across the country.
                </p>
              </div>
              <div className="text-center">
                <Heart className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Earn Rewards</h3>
                <p className="text-gray-300">
                  Get MyImpact rewards on every purchase and track your community contribution.
                </p>
              </div>
              <div className="text-center">
                <Globe className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Join The Movement</h3>
                <p className="text-gray-300">
                  Be part of a growing network dedicated to building stronger Black communities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;