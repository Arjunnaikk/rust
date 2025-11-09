"use client"

import { useBlogProgram } from "../hooks/useAnchorQueries"
import { BlogList } from '../BlogList';

export function DashboardFeature() {
  const { getAllBlogs } = useBlogProgram();
  const { data } = getAllBlogs;

  console.log(data)

  return (
    <>
      {/* <Button onClick={() => {}} >Click me</Button> */}

      {/* show all the data */}
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
      <BlogList />
    </>
  )
}
