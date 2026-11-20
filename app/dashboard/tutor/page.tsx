import React from "react"

const TutorDashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const search = await searchParams;
  console.log('searchParams', search);
  return (
    <div>
      <h2>tutor page</h2>
    </div>
  )
}

export default TutorDashboardPage
