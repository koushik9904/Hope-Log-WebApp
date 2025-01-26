'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/app/hooks/useAuth'
import Link from 'next/link'
import { BounceLoader } from 'react-spinners';
import { Link as ScrollLink } from 'react-scroll';

const navigation = [
    { name: 'Features', scrollTo: 'features-landing' },
    { name: 'How it works', scrollTo: 'how-journaling-works' },
    { name: 'Pricing', scrollTo: 'pricing-landing' },
]

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { handleLogout, logOutIsLoading, userMetaData, isLoggedIn } = useAuth()

    return (
        <>
            {logOutIsLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white flex flex-col items-center">
                        <BounceLoader color="#ffffff" />
                        <p className="mt-4">Logout successful. Returning you to the homepage...</p>
                    </div>
                </div>
            )}
            <header className="text-white bg-dark">
                <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                    <div className="flex lg:flex-1">
                        <Link href="/" className="-m-1.5 p-1.5 flex justify-center items-center">
                            <h1 className="text-xl fontWeight-semibold">HopeLog</h1>
                        </Link>
                    </div>
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5">
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="hidden lg:flex lg:gap-x-12">
                        {navigation.map((item) => (
                            <ScrollLink
                                key={item.name}
                                to={item.scrollTo}
                                style={{ cursor: 'pointer' }}
                                smooth={true}
                                duration={500}
                                className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-white-50"
                            >
                                {item.name}
                            </ScrollLink>
                        ))}
                    </div>
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {isLoggedIn && userMetaData ? (
                            <>
                                <span className="mr-4 text-sm/6 font-semibold">Welcome {userMetaData.name}</span>
                                <Link href="/" onClick={handleLogout} className="text-sm/6 font-semibold">
                                    Log out <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="text-sm/6 font-semibold bg-ascent px-4 py-2 rounded-md text-white">
                                Get Started
                            </Link>
                        )}
                    </div>
                </nav>
                <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                    <div className="fixed inset-0 z-10" />
                    <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-dark text-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white-900/10">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5">
                                <h1 className="text-xl fontWeight-semibold">HopeLog</h1>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="-m-2.5 rounded-md p-2.5"
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon aria-hidden="true" className="size-6" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-white-500/10">
                                <div className="space-y-2 py-6">
                                    {navigation.map((item) => (
                                        <ScrollLink
                                            key={item.name}
                                            style={{ cursor: 'pointer' }}
                                            to={item.scrollTo}
                                            smooth={true}
                                            duration={500}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-white-50"
                                        >
                                            {item.name}
                                        </ScrollLink>
                                    ))}
                                    {isLoggedIn && userMetaData ? (
                                        <div className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white">
                                            <span className="block mb-2">Welcome {userMetaData.name}</span>
                                            <Link
                                                href="/"
                                                onClick={handleLogout}
                                                className="text-sm/6 font-semibold"
                                            >
                                                Log out <span aria-hidden="true">&rarr;</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold bg-ascent text-white text-center mt-4"
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Dialog>
            </header>
        </>
    )
}
